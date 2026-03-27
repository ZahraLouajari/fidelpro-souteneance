<?php
namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\LoyaltyCard;
use App\Models\User;
use App\Models\Visit;
use App\Models\Reward;
use App\Models\CustomNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class RestaurantController extends Controller
{
    public function dashboard()
    {
        try {
            $user = auth('api')->user();
            $restaurant = Restaurant::where('owner_id', $user->id)->firstOrFail();

            $totalClients = LoyaltyCard::where('restaurant_id', $restaurant->id)->count();
            $visitsToday = Visit::where('restaurant_id', $restaurant->id)
                ->whereDate('created_at', today())
                ->where('is_cancelled', false)
                ->count();
            $visitsWeek = Visit::where('restaurant_id', $restaurant->id)
                ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->where('is_cancelled', false)
                ->count();
            $rewardsGiven = LoyaltyCard::where('restaurant_id', $restaurant->id)
                ->where('status', 'completed')
                ->count();

            $clientsByLevel = LoyaltyCard::where('restaurant_id', $restaurant->id)
                ->select('loyalty_level', DB::raw('count(*) as total'))
                ->groupBy('loyalty_level')
                ->get()
                ->pluck('total', 'loyalty_level')
                ->toArray();

            $levelStats = [
                'bronze' => $clientsByLevel['bronze'] ?? 0,
                'silver' => $clientsByLevel['silver'] ?? 0,
                'gold' => $clientsByLevel['gold'] ?? 0,
                'vip' => $clientsByLevel['vip'] ?? 0,
            ];

            $recentVisits = Visit::with('client')
                ->where('restaurant_id', $restaurant->id)
                ->where('is_cancelled', false)
                ->latest()
                ->take(10)
                ->get();

            return response()->json([
                'restaurant'    => $restaurant,
                'stats'         => [
                    'total_clients' => $totalClients,
                    'visits_today'  => $visitsToday,
                    'visits_week'   => $visitsWeek,
                    'rewards_given' => $rewardsGiven,
                ],
                'level_stats'   => $levelStats,
                'recent_visits' => $recentVisits,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function clients()
    {
        try {
            $restaurant = Restaurant::where('owner_id', auth('api')->id())->firstOrFail();
            $cards = LoyaltyCard::with('client')
                ->where('restaurant_id', $restaurant->id)
                ->get();
            return response()->json($cards);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function addClient(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required_without:email|exists:users,id',
            'email'     => 'required_without:client_id|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $owner = auth('api')->user();
        $restaurant = Restaurant::where('owner_id', $owner->id)->firstOrFail();

        // Chercher le client par ID ou email
        if ($request->has('client_id')) {
            $client = User::find($request->client_id);
            if (!$client) {
                return response()->json(['error' => 'Client non trouvé.'], 404);
            }
        } else {
            // Chercher par email, si pas trouvé, créer un nouveau client
            $client = User::where('email', $request->email)->first();
            
            if (!$client) {
                // Créer un nouveau client automatiquement
                $client = User::create([
                    'name' => explode('@', $request->email)[0], // Nom par défaut = partie avant @
                    'email' => $request->email,
                    'password' => bcrypt('demo'),
                    'role' => 'client',
                    'is_blocked' => false,
                ]);
                
                // Notification au nouveau client
                CustomNotification::create([
                    'user_id' => $client->id,
                    'role' => 'client',
                    'title' => 'Bienvenue sur FidélitéPro! 🎉',
                    'message' => "Votre compte a été créé automatiquement par {$restaurant->name}. Vous pouvez vous connecter avec votre email et le mot de passe 'demo'.",
                    'type' => 'system',
                    'is_read' => false,
                ]);
            }
        }

        // Vérifier si le client a déjà une carte pour ce restaurant
        $existing = LoyaltyCard::where('client_id', $client->id)
            ->where('restaurant_id', $restaurant->id)
            ->first();

        if ($existing) {
            return response()->json(['error' => 'Ce client a déjà une carte fidélité.'], 409);
        }

        // Créer la carte de fidélité
        $card = LoyaltyCard::create([
            'client_id'     => $client->id,
            'restaurant_id' => $restaurant->id,
            'current_visits'=> 0,
            'status'        => 'active',
            'loyalty_level' => 'bronze',
        ]);

        // Notifier le client
        CustomNotification::create([
            'user_id' => $client->id,
            'role'    => 'client',
            'title'   => 'Nouvelle carte fidélité! 🎉',
            'message' => "Vous avez été ajouté au programme de fidélité de {$restaurant->name}.",
            'type'    => 'system',
            'is_read' => false,
        ]);

        // Notifier le restaurant
        CustomNotification::create([
            'user_id' => $owner->id,
            'role'    => 'restaurant',
            'title'   => 'Nouveau client ajouté 👤',
            'message' => "Un nouveau client a été ajouté à votre programme de fidélité.",
            'type'    => 'system',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Client ajouté.',
            'card' => $card->load('client'),
            'is_new' => $client->wasRecentlyCreated ?? false
        ], 201);
    }

    public function addVisit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $owner = auth('api')->user();
            $restaurant = Restaurant::where('owner_id', $owner->id)->firstOrFail();

            // Vérifier si le client a une carte, sinon en créer une automatiquement
            $card = LoyaltyCard::where('client_id', $request->client_id)
                ->where('restaurant_id', $restaurant->id)
                ->first();

            if (!$card) {
                // Créer une carte automatiquement
                $card = LoyaltyCard::create([
                    'client_id' => $request->client_id,
                    'restaurant_id' => $restaurant->id,
                    'current_visits' => 0,
                    'status' => 'active',
                    'loyalty_level' => 'bronze',
                ]);
                
                CustomNotification::create([
                    'user_id' => $request->client_id,
                    'role' => 'client',
                    'title' => 'Nouvelle carte fidélité! 🎉',
                    'message' => "Vous avez été ajouté au programme de fidélité de {$restaurant->name}.",
                    'type' => 'system',
                    'is_read' => false,
                ]);
            }

            // Ajouter la visite
            $oldLevel = $card->loyalty_level;
            $visit = $card->addVisit();
            $newLevel = $card->fresh()->loyalty_level;

            // Notifications
            CustomNotification::create([
                'user_id' => $request->client_id,
                'role' => 'client',
                'title' => 'Visite enregistrée! ⭐',
                'message' => "Visite #{$card->current_visits} chez {$restaurant->name}. Continuez comme ça!",
                'type' => 'visit',
                'is_read' => false,
            ]);

            CustomNotification::create([
                'user_id' => $owner->id,
                'role' => 'restaurant',
                'title' => 'Visite enregistrée ✅',
                'message' => "Une nouvelle visite a été enregistrée dans {$restaurant->name}.",
                'type' => 'visit',
                'is_read' => false,
            ]);

            if ($oldLevel !== $newLevel) {
                CustomNotification::create([
                    'user_id' => $request->client_id,
                    'role' => 'client',
                    'title' => 'Niveau de fidélité augmenté! 🎉',
                    'message' => "Félicitations! Vous êtes passé au niveau " . ucfirst($newLevel) . ".",
                    'type' => 'reward',
                    'is_read' => false,
                ]);
            }

            if ($card->fresh()->status === 'completed') {
                Reward::create([
                    'client_id' => $card->client_id,
                    'restaurant_id' => $restaurant->id,
                    'loyalty_card_id' => $card->id,
                    'description' => $restaurant->reward_description,
                    'status' => 'available',
                ]);

                CustomNotification::create([
                    'user_id' => $request->client_id,
                    'role' => 'client',
                    'title' => 'Récompense débloquée! 🎁',
                    'message' => "Félicitations! Vous avez gagné: {$restaurant->reward_description} chez {$restaurant->name}!",
                    'type' => 'reward',
                    'is_read' => false,
                ]);
            }

            return response()->json([
                'message' => 'Visite ajoutée.',
                'visit'   => $visit,
                'card'    => $card->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function blockClient($clientId)
    {
        try {
            $owner = auth('api')->user();
            $restaurant = Restaurant::where('owner_id', $owner->id)->firstOrFail();

            $card = LoyaltyCard::where('client_id', $clientId)
                ->where('restaurant_id', $restaurant->id)
                ->firstOrFail();

            $card->update(['status' => 'expired']);

            CustomNotification::create([
                'user_id' => $clientId,
                'role'    => 'client',
                'title'   => 'Accès bloqué 🚫',
                'message' => "Votre accès au programme de fidélité de {$restaurant->name} a été suspendu.",
                'type'    => 'system',
                'is_read' => false,
            ]);

            CustomNotification::create([
                'user_id' => $owner->id,
                'role'    => 'restaurant',
                'title'   => 'Client bloqué 🚫',
                'message' => "Un client a été bloqué de votre programme de fidélité.",
                'type'    => 'system',
                'is_read' => false,
            ]);

            return response()->json(['message' => 'Client bloqué de ce restaurant.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateRestaurant(Request $request)
    {
        try {
            $owner = auth('api')->user();
            $restaurant = Restaurant::where('owner_id', $owner->id)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'name'               => 'sometimes|string|max:100',
                'location'           => 'sometimes|string|max:200',
                'category'           => 'sometimes|string|max:50',
                'visits_required'    => 'sometimes|integer|min:3|max:50',
                'reward_description' => 'sometimes|string|max:200',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $restaurant->update($request->only([
                'name', 'location', 'category', 'visits_required', 'reward_description'
            ]));

            return response()->json([
                'restaurant' => $restaurant,
                'message' => 'Restaurant mis à jour.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function weeklyStats()
    {
        try {
            $restaurant = Restaurant::where('owner_id', auth('api')->id())->firstOrFail();

            $data = collect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
                ->map(function ($day, $index) use ($restaurant) {
                    $date = now()->startOfWeek()->addDays($index);
                    $count = Visit::where('restaurant_id', $restaurant->id)
                        ->whereDate('created_at', $date)
                        ->where('is_cancelled', false)
                        ->count();
                    return ['day' => $day, 'visits' => $count];
                });

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}