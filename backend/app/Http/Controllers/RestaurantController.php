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
    // ─── Helper : récupère le restaurant de l'utilisateur connecté ───────────────
    // Si aucun restaurant n'existe encore, en crée un vide automatiquement.
    // ─── Helper : crée un message multilingue JSON ──────────────────────────────
    private function ml(string $fr, string $en, string $ar): string
    {
        return json_encode(['fr' => $fr, 'en' => $en, 'ar' => $ar], JSON_UNESCAPED_UNICODE);
    }

    // ─── Helper : récupère le restaurant ou null (ne crée JAMAIS automatiquement) ─
    private function getRestaurant(): ?Restaurant
    {
        return Restaurant::where('owner_id', auth('api')->id())->first();
    }

    // ─── Helper : récupère le restaurant ou retourne 404 json ────────────────────
    private function requireRestaurant(): Restaurant
    {
        $restaurant = $this->getRestaurant();
        if (!$restaurant) {
            abort(404, 'no_restaurant');
        }
        return $restaurant;
    }

    // ─── Create Restaurant (first time setup) ────────────────────────────────────
    public function createRestaurant(Request $request)
    {
        try {
            $user = auth('api')->user();

            // Si déjà un restaurant — retourner le existant
            $existing = Restaurant::where('owner_id', $user->id)->first();
            if ($existing) {
                return response()->json([
                    'restaurant' => $existing,
                    'message'    => 'Restaurant already exists.',
                ], 200);
            }

            $validator = Validator::make($request->all(), [
                'name'               => 'required|string|max:100',
                'location'           => 'required|string|max:200',
                'category'           => 'required|string|max:50',
                'latitude'           => 'nullable|numeric',
                'longitude'          => 'nullable|numeric',
                'visits_required'    => 'required|integer|min:1|max:50',
                'reward_description' => 'required|string|max:200',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $restaurant = Restaurant::create([
                'owner_id'           => $user->id,
                'name'               => $request->name,
                'location'           => $request->location,
                'category'           => $request->category,
                'latitude'           => $request->latitude,
                'longitude'          => $request->longitude,
                'visits_required'    => $request->visits_required,
                'reward_description' => $request->reward_description,
                'is_active'          => true,
            ]);

            // Notification de bienvenue (message multilingue JSON)
            $name = $restaurant->name;
            $message = json_encode([
                'fr' => "Votre restaurant {$name} est maintenant actif sur FidélitéPro.",
                'en' => "Your restaurant {$name} is now active on FidélitéPro.",
                'ar' => "مطعمك {$name} أصبح الآن نشطاً على FidélitéPro.",
            ]);
            CustomNotification::create([
                'user_id' => $user->id,
                'role'    => 'restaurant',
                'title'   => json_encode([
                    'fr' => '🎉 Restaurant créé avec succès!',
                    'en' => '🎉 Restaurant created successfully!',
                    'ar' => '🎉 تم إنشاء المطعم بنجاح!',
                ]),
                'message' => $message,
                'type'    => 'system',
                'is_read' => false,
            ]);

            return response()->json([
                'restaurant' => $restaurant,
                'message'    => 'Restaurant created successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ─── Client Info (lookup avant enregistrement de visite) ────────────────────
    public function clientInfo($clientId)
    {
        try {
            $restaurant = $this->requireRestaurant();

            $client = \App\Models\User::find($clientId);
            if (!$client || $client->role !== 'client') {
                return response()->json([
                    'error'   => 'client_not_found',
                    'message' => 'Client not found.',
                ], 404);
            }

            // Chercher la carte de fidélité de ce client dans ce restaurant
            $card = \App\Models\LoyaltyCard::where('client_id', $clientId)
                ->where('restaurant_id', $restaurant->id)
                ->first();

            // Autres restaurants visités par ce client
            $otherCards = \App\Models\LoyaltyCard::with('restaurant')
                ->where('client_id', $client->id)
                ->where('restaurant_id', '!=', $restaurant->id)
                ->get()
                ->map(fn($c) => [
                    'id'       => $c->restaurant->id,
                    'name'     => $c->restaurant->name,
                    'location' => $c->restaurant->location,
                    'visits'   => $c->current_visits,
                    'level'    => $c->loyalty_level,
                ]);

            return response()->json([
                'client' => [
                    'id'     => $client->id,
                    'name'   => $client->name,
                    'email'  => $client->email,
                    'avatar' => $client->avatar,
                ],
                'card' => $card ? [
                    'id'              => $card->id,
                    'current_visits'  => $card->current_visits,
                    'loyalty_level'   => $card->loyalty_level,
                    'status'          => $card->status,
                    'visits_required' => $restaurant->visits_required,
                    'visits_to_next'  => max(0, $restaurant->visits_required - $card->current_visits),
                    'reward'          => $restaurant->reward_description,
                ] : null,
                'restaurant' => [
                    'name'            => $restaurant->name,
                    'visits_required' => $restaurant->visits_required,
                    'reward'          => $restaurant->reward_description,
                ],
                'is_member'          => $card !== null,
                'other_restaurants'  => $otherCards,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ─── Dashboard ───────────────────────────────────────────────────────────────
    public function dashboard()
    {
        try {
            $restaurant = $this->getRestaurant();
            if (!$restaurant) {
                return response()->json(['error' => 'no_restaurant'], 404);
            }

            $totalClients = LoyaltyCard::where('restaurant_id', $restaurant->id)->count();
            $visitsToday  = Visit::where('restaurant_id', $restaurant->id)
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
                'gold'   => $clientsByLevel['gold']   ?? 0,
                'vip'    => $clientsByLevel['vip']    ?? 0,
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

    // ─── Clients ─────────────────────────────────────────────────────────────────
    public function clients()
    {
        try {
            $restaurant = $this->requireRestaurant();
            $cards = LoyaltyCard::with('client')
                ->where('restaurant_id', $restaurant->id)
                ->get();
            return response()->json($cards);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ─── Add Client ───────────────────────────────────────────────────────────────
    public function addClient(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required_without:email|exists:users,id',
            'email'     => 'required_without:client_id|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $restaurant = $this->requireRestaurant();
        $owner      = auth('api')->user();

        // Chercher le client par ID ou email
        if ($request->has('client_id')) {
            $client = User::find($request->client_id);
            if (!$client) {
                return response()->json(['error' => 'Client non trouvé.'], 404);
            }
        } else {
            $client = User::where('email', $request->email)->first();

            if (!$client) {
                // Créer un nouveau client automatiquement
                $client = User::create([
                    'name'       => explode('@', $request->email)[0],
                    'email'      => $request->email,
                    'password'   => bcrypt('demo'),
                    'role'       => 'client',
                    'is_blocked' => false,
                ]);

                CustomNotification::create([
                    'user_id' => $client->id,
                    'role'    => 'client',
                    'title'   => 'Bienvenue sur FidélitéPro! 🎉',
                    'message' => $this->ml(
                        "Votre compte a été créé automatiquement par {$restaurant->name}. Mot de passe: 'demo'.",
                        "Your account was automatically created by {$restaurant->name}. Password: 'demo'.",
                        "تم إنشاء حسابك تلقائياً بواسطة {$restaurant->name}. كلمة المرور: 'demo'.",
                    ),
                    'type'    => 'system',
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
            'client_id'      => $client->id,
            'restaurant_id'  => $restaurant->id,
            'current_visits' => 0,
            'status'         => 'active',
            'loyalty_level'  => 'bronze',
        ]);

        CustomNotification::create([
            'user_id' => $client->id,
            'role'    => 'client',
            'title'   => 'Nouvelle carte fidélité! 🎉',
            'message' => $this->ml(
                    "Vous avez été ajouté au programme de fidélité de {$restaurant->name}.",
                    "You have been added to the loyalty program of {$restaurant->name}.",
                    "تمت إضافتك إلى برنامج الولاء في {$restaurant->name}.",
                ),
            'type'    => 'system',
            'is_read' => false,
        ]);

        CustomNotification::create([
            'user_id' => $owner->id,
            'role'    => 'restaurant',
            'title'   => 'Nouveau client ajouté 👤',
            'message' => $this->ml(
                'Un nouveau client a été ajouté à votre programme de fidélité.',
                'A new client has been added to your loyalty program.',
                'تمت إضافة عميل جديد إلى برنامج الولاء الخاص بك.',
            ),
            'type'    => 'system',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Client ajouté.',
            'card'    => $card->load('client'),
            'is_new'  => $client->wasRecentlyCreated ?? false,
        ], 201);
    }

    // ─── Add Visit ────────────────────────────────────────────────────────────────
    public function addVisit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $owner      = auth('api')->user();
            $restaurant = $this->requireRestaurant();

            // Vérifier si le client a une carte, sinon en créer une automatiquement
            $card = LoyaltyCard::where('client_id', $request->client_id)
                ->where('restaurant_id', $restaurant->id)
                ->first();

            if (!$card) {
                $card = LoyaltyCard::create([
                    'client_id'      => $request->client_id,
                    'restaurant_id'  => $restaurant->id,
                    'current_visits' => 0,
                    'status'         => 'active',
                    'loyalty_level'  => 'bronze',
                ]);

                CustomNotification::create([
                    'user_id' => $request->client_id,
                    'role'    => 'client',
                    'title'   => 'Nouvelle carte fidélité! 🎉',
                    'message' => $this->ml(
                    "Vous avez été ajouté au programme de fidélité de {$restaurant->name}.",
                    "You have been added to the loyalty program of {$restaurant->name}.",
                    "تمت إضافتك إلى برنامج الولاء في {$restaurant->name}.",
                ),
                    'type'    => 'system',
                    'is_read' => false,
                ]);
            }

            $oldLevel = $card->loyalty_level;
            $visit    = $card->addVisit();
            $newLevel = $card->fresh()->loyalty_level;

            CustomNotification::create([
                'user_id' => $request->client_id,
                'role'    => 'client',
                'title'   => 'Visite enregistrée! ⭐',
                'message' => $this->ml(
                    "Visite #{$card->current_visits} chez {$restaurant->name}. Continuez comme ça!",
                    "Visit #{$card->current_visits} at {$restaurant->name}. Keep it up!",
                    "الزيارة رقم #{$card->current_visits} في {$restaurant->name}. واصل!",
                ),
                'type'    => 'visit',
                'is_read' => false,
            ]);

            CustomNotification::create([
                'user_id' => $owner->id,
                'role'    => 'restaurant',
                'title'   => 'Visite enregistrée ✅',
                'message' => $this->ml(
                    "Une nouvelle visite a été enregistrée dans {$restaurant->name}.",
                    "A new visit has been recorded at {$restaurant->name}.",
                    "تم تسجيل زيارة جديدة في {$restaurant->name}.",
                ),
                'type'    => 'visit',
                'is_read' => false,
            ]);

            if ($oldLevel !== $newLevel) {
                CustomNotification::create([
                    'user_id' => $request->client_id,
                    'role'    => 'client',
                    'title'   => 'Niveau de fidélité augmenté! 🎉',
                    'message' => $this->ml(
                        "Félicitations! Vous êtes passé au niveau " . ucfirst($newLevel) . ".",
                        "Congratulations! You reached the " . ucfirst($newLevel) . " level.",
                        "تهانينا! لقد وصلت إلى مستوى " . ucfirst($newLevel) . ".",
                    ),
                    'type'    => 'reward',
                    'is_read' => false,
                ]);
            }

            if ($card->fresh()->status === 'completed') {
                Reward::create([
                    'client_id'       => $card->client_id,
                    'restaurant_id'   => $restaurant->id,
                    'loyalty_card_id' => $card->id,
                    'description'     => $restaurant->reward_description,
                    'status'          => 'available',
                ]);

                CustomNotification::create([
                    'user_id' => $request->client_id,
                    'role'    => 'client',
                    'title'   => 'Récompense débloquée! 🎁',
                    'message' => $this->ml(
                        "Félicitations! Vous avez gagné: {$restaurant->reward_description} chez {$restaurant->name}!",
                        "Congratulations! You earned: {$restaurant->reward_description} at {$restaurant->name}!",
                        "تهانينا! لقد ربحت: {$restaurant->reward_description} في {$restaurant->name}!",
                    ),
                    'type'    => 'reward',
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

    // ─── Block Client ─────────────────────────────────────────────────────────────
    public function blockClient($clientId)
    {
        try {
            $owner      = auth('api')->user();
            $restaurant = $this->requireRestaurant();

            $card = LoyaltyCard::where('client_id', $clientId)
                ->where('restaurant_id', $restaurant->id)
                ->first();

            if (!$card) {
                return response()->json(['error' => 'Client non trouvé dans ce restaurant.'], 404);
            }

            $card->update(['status' => 'expired']);

            CustomNotification::create([
                'user_id' => $clientId,
                'role'    => 'client',
                'title'   => 'Accès bloqué 🚫',
                'message' => $this->ml(
                    "Votre accès au programme de fidélité de {$restaurant->name} a été suspendu.",
                    "Your access to the loyalty program of {$restaurant->name} has been suspended.",
                    "تم تعليق وصولك إلى برنامج الولاء في {$restaurant->name}.",
                ),
                'type'    => 'system',
                'is_read' => false,
            ]);

            CustomNotification::create([
                'user_id' => $owner->id,
                'role'    => 'restaurant',
                'title'   => 'Client bloqué 🚫',
                'message' => $this->ml(
                    'Un client a été bloqué de votre programme de fidélité.',
                    'A client has been blocked from your loyalty program.',
                    'تم حظر عميل من برنامج الولاء الخاص بك.',
                ),
                'type'    => 'system',
                'is_read' => false,
            ]);

            return response()->json(['message' => 'Client bloqué de ce restaurant.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ─── Update Restaurant Settings ───────────────────────────────────────────────
    public function updateRestaurant(Request $request)
    {
        try {
            $restaurant = $this->requireRestaurant();

            $validator = Validator::make($request->all(), [
                'name'               => 'sometimes|string|max:100',
                'location'           => 'sometimes|string|max:200',
                'category'           => 'sometimes|string|max:50',
                'latitude'           => 'nullable|numeric',
                'longitude'          => 'nullable|numeric',
                'visits_required'    => 'sometimes|integer|min:3|max:50',
                'reward_description' => 'sometimes|string|max:200',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $restaurant->update($request->only([
                'name', 'location', 'latitude', 'longitude', 'category', 'visits_required', 'reward_description'
            ]));

            return response()->json([
                'restaurant' => $restaurant,
                'message'    => 'Restaurant mis à jour.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ─── Weekly Stats ─────────────────────────────────────────────────────────────
    public function weeklyStats()
    {
        try {
            $restaurant = $this->requireRestaurant();

            $data = collect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
                ->map(function ($day, $index) use ($restaurant) {
                    $date  = now()->startOfWeek()->addDays($index);
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