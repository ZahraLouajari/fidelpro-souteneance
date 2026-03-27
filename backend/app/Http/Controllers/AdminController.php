<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Restaurant;
use App\Models\Visit;
use App\Models\CustomNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    public function dashboard()
    {
        $totalClients      = User::clients()->count();
        $totalRestaurants  = Restaurant::count();
        $totalVisits       = Visit::where('is_cancelled', false)->count();

        $lastMonth = Visit::where('is_cancelled', false)
            ->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->count();
        $thisMonth = Visit::where('is_cancelled', false)
            ->whereBetween('created_at', [now()->startOfMonth(), now()])
            ->count();
        $growth = $lastMonth > 0 ? round((($thisMonth - $lastMonth) / $lastMonth) * 100) : 100;

        return response()->json([
            'stats' => [
                'total_clients'      => $totalClients,
                'total_restaurants'  => $totalRestaurants,
                'total_visits'       => $totalVisits,
                'growth'             => "+{$growth}%",
            ],
        ]);
    }

    public function clients()
    {
        $clients = User::clients()
            ->withCount(['loyaltyCards', 'visits'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($clients);
    }

    public function restaurants()
    {
        $restaurants = Restaurant::with('owner')
            ->withCount(['loyaltyCards', 'visits'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($restaurants);
    }

    public function toggleBlockUser($userId)
    {
        $admin = auth('api')->user();
        $user  = User::findOrFail($userId);

        $user->update(['is_blocked' => !$user->is_blocked]);

        // Notif l user (client aw resto)
        CustomNotification::create([
            'user_id' => $user->id,
            'title'   => $user->is_blocked ? 'Compte bloqué 🚫' : 'Compte débloqué ✅',
            'message' => $user->is_blocked
                ? 'Votre compte a été bloqué par un administrateur.'
                : 'Votre compte a été débloqué par un administrateur.',
            'type'    => 'system',
        ]);

        // Notif l admin
        CustomNotification::create([
            'user_id' => $admin->id,
            'title'   => $user->is_blocked ? 'Utilisateur bloqué 🚫' : 'Utilisateur débloqué ✅',
            'message' => "{$user->name} a été " . ($user->is_blocked ? 'bloqué' : 'débloqué') . " avec succès.",
            'type'    => 'system',
        ]);

        $status = $user->is_blocked ? 'bloqué' : 'débloqué';
        return response()->json(['message' => "Utilisateur {$status}.", 'user' => $user]);
    }

    public function deleteUser($userId)
    {
        $admin = auth('api')->user();
        $user  = User::findOrFail($userId);

        if ($user->role === 'admin') {
            return response()->json(['error' => 'Impossible de supprimer un admin.'], 403);
        }

        $userName = $user->name;
        $user->delete();

        // Notif l admin
        CustomNotification::create([
            'user_id' => $admin->id,
            'title'   => 'Utilisateur supprimé 🗑️',
            'message' => "{$userName} a été supprimé de la plateforme.",
            'type'    => 'system',
        ]);

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }

    public function addRestaurant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'owner_id'           => 'required|exists:users,id',
            'name'               => 'required|string|max:100',
            'location'           => 'required|string|max:200',
            'category'           => 'nullable|string|max:50',
            'visits_required'    => 'required|integer|min:3',
            'reward_description' => 'required|string|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $admin      = auth('api')->user();
        $restaurant = Restaurant::create($request->all());

        // Notif l admin
        CustomNotification::create([
            'user_id' => $admin->id,
            'title'   => 'Nouveau restaurant ajouté 🍽️',
            'message' => "{$restaurant->name} a été ajouté à la plateforme.",
            'type'    => 'system',
        ]);

        // Notif l owner du restaurant
        CustomNotification::create([
            'user_id' => $request->owner_id,
            'title'   => 'Votre restaurant est en ligne! 🎉',
            'message' => "{$restaurant->name} a été créé et est maintenant actif sur FidélitéPro.",
            'type'    => 'system',
        ]);

        return response()->json(['restaurant' => $restaurant, 'message' => 'Restaurant créé.'], 201);
    }

    public function deleteRestaurant($restaurantId)
    {
        $admin      = auth('api')->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        $restoName  = $restaurant->name;

        $restaurant->delete();

        // Notif l admin
        CustomNotification::create([
            'user_id' => $admin->id,
            'title'   => 'Restaurant supprimé 🗑️',
            'message' => "{$restoName} a été supprimé de la plateforme.",
            'type'    => 'system',
        ]);

        return response()->json(['message' => 'Restaurant supprimé.']);
    }

    public function monthlyGrowth()
    {
        $data = collect(range(0, 5))->map(function ($i) {
            $date = now()->subMonths(5 - $i);
            return [
                'month'   => $date->format('M'),
                'clients' => User::clients()
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->count(),
                'visits'  => Visit::where('is_cancelled', false)
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->count(),
            ];
        });

        return response()->json($data);
    }

    public function categoryDistribution()
    {
        $data = Restaurant::select('category', DB::raw('count(*) as value'))
            ->groupBy('category')
            ->get();

        return response()->json($data);
    }

    public function topClients()
    {
        $data = User::clients()
            ->withCount(['visits' => fn($q) => $q->where('is_cancelled', false)])
            ->withCount('loyaltyCards')
            ->orderBy('visits_count', 'desc')
            ->take(10)
            ->get()
            ->map(fn($u) => [
                'name'        => $u->name,
                'visits'      => $u->visits_count,
                'restaurants' => $u->loyalty_cards_count,
            ]);

        return response()->json($data);
    }
}