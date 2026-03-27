<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyCard;
use App\Models\Reward;
use App\Models\Visit;
use App\Models\Restaurant;
use App\Models\CustomNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    public function dashboard()
    {
        try {
            $user = auth('api')->user();

            $cards = LoyaltyCard::with('restaurant')
                ->where('client_id', $user->id)
                ->get()
                ->map(function ($card) {
                    $level = $card->computeLevel();
                    $next = $card->next_level;

                    return [
                        'id' => $card->id,
                        'restaurant' => $card->restaurant,
                        'current_visits' => $card->current_visits,
                        'total_required' => $card->restaurant->visits_required,
                        'reward' => $card->restaurant->reward_description,
                        'status' => $card->status,
                        'last_visit' => $card->last_visit_at?->format('Y-m-d'),
                        'level' => $level,
                        'next_level' => $next['name'],
                        'visits_to_next' => $next['needed'],
                    ];
                });

            $joinedRestoIds = LoyaltyCard::where('client_id', $user->id)->pluck('restaurant_id');
            
            $availableRestos = Restaurant::where('is_active', true)
                ->whereNotIn('id', $joinedRestoIds)
                ->get(['id', 'name', 'location', 'category', 'reward_description', 'visits_required']);

            $weeklyVisits = collect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
                ->map(function ($day, $index) use ($user) {
                    $date = now()->startOfWeek()->addDays($index);
                    $count = Visit::where('client_id', $user->id)
                        ->whereDate('created_at', $date)
                        ->where('is_cancelled', false)
                        ->count();
                    return ['day' => $day, 'visits' => $count];
                });

            return response()->json([
                'stats' => [
                    'restaurants_visited' => $cards->count(),
                    'total_visits' => $cards->sum('current_visits'),
                    'points' => $cards->sum('current_visits') * 10,
                    'rewards_earned' => $cards->where('status', 'completed')->count(),
                ],
                'loyalty_cards' => $cards,
                'available_restaurants' => $availableRestos,
                'weekly_visits' => $weeklyVisits,
            ]);
        } catch (\Exception $e) {
            \Log::error('Dashboard error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function loyaltyCards()
    {
        try {
            $user = auth('api')->user();
            $cards = LoyaltyCard::with('restaurant')
                ->where('client_id', $user->id)
                ->orderBy('updated_at', 'desc')
                ->get()
                ->map(function ($card) {
                    return [
                        'id' => $card->id,
                        'restaurant' => $card->restaurant,
                        'current_visits' => $card->current_visits,
                        'total_required' => $card->restaurant->visits_required,
                        'reward' => $card->restaurant->reward_description,
                        'status' => $card->status,
                        'level' => $card->computeLevel(),
                        'next_level' => $card->next_level['name'],
                        'visits_to_next' => $card->next_level['needed'],
                    ];
                });

            return response()->json(['cards' => $cards]);
        } catch (\Exception $e) {
            \Log::error('LoyaltyCards error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function cancelVisit($cardId)
    {
        try {
            $user = auth('api')->user();
            $card = LoyaltyCard::with('restaurant')
                ->where('client_id', $user->id)
                ->findOrFail($cardId);

            if ($card->cancelLastVisit()) {
                CustomNotification::create([
                    'user_id' => $user->id,
                    'role' => 'client',
                    'title' => 'Visite annulée ❌',
                    'message' => "Votre dernière visite chez {$card->restaurant->name} a été annulée.",
                    'type' => 'visit',
                    'is_read' => false,
                ]);
                return response()->json(['message' => 'Visite annulée.', 'card' => $card->fresh()]);
            }

            return response()->json(['error' => 'Aucune visite à annuler.'], 400);
        } catch (\Exception $e) {
            \Log::error('CancelVisit error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function rewards()
    {
        try {
            $user = auth('api')->user();
            
            $rewards = Reward::with('restaurant')
                ->where('client_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($reward) {
                    return [
                        'id' => $reward->id,
                        'description' => $reward->reward_description ?? $reward->description ?? 'Récompense',
                        'restaurantName' => $reward->restaurant->name,
                        'unlockedAt' => $reward->created_at->format('Y-m-d'),
                        'redeemed' => $reward->status === 'redeemed',
                        'restaurant' => $reward->restaurant,
                        'created_at' => $reward->created_at,
                    ];
                });

            return response()->json($rewards);
        } catch (\Exception $e) {
            \Log::error('Rewards error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function redeemReward($rewardId)
    {
        try {
            $user = auth('api')->user();
            $reward = Reward::with('restaurant')
                ->where('client_id', $user->id)
                ->where('status', 'available')
                ->findOrFail($rewardId);

            $reward->update(['status' => 'redeemed', 'redeemed_at' => now()]);

            CustomNotification::create([
                'user_id' => $user->id,
                'role' => 'client',
                'title' => 'Récompense utilisée! ✅',
                'message' => "Vous avez utilisé votre récompense chez {$reward->restaurant->name}.",
                'type' => 'reward',
                'is_read' => false,
            ]);

            return response()->json(['message' => 'Récompense utilisée!', 'reward' => $reward]);
        } catch (\Exception $e) {
            \Log::error('RedeemReward error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function joinRestaurant(Request $request)
    {
        try {
            $user = auth('api')->user();
            
            $validator = Validator::make($request->all(), [
                'restaurant_id' => 'required|exists:restaurants,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            
            $restaurant = Restaurant::findOrFail($request->restaurant_id);
            
            if (!$restaurant->is_active) {
                return response()->json(['error' => 'This restaurant is not active'], 400);
            }
            
            $existingCard = LoyaltyCard::where('client_id', $user->id)
                ->where('restaurant_id', $restaurant->id)
                ->first();
                
            if ($existingCard) {
                return response()->json(['error' => 'You already joined this restaurant'], 400);
            }
            
            $card = LoyaltyCard::create([
                'client_id' => $user->id,
                'restaurant_id' => $restaurant->id,
                'current_visits' => 0,
                'status' => 'active',
                'loyalty_level' => 'bronze',
                'last_visit_at' => null,
            ]);
            
            CustomNotification::create([
                'user_id' => $restaurant->owner_id,
                'role' => 'restaurant',
                'title' => 'New client joined! 👤',
                'message' => "{$user->name} has joined your loyalty program at {$restaurant->name}.",
                'type' => 'system',
                'is_read' => false,
            ]);
            
            CustomNotification::create([
                'user_id' => $user->id,
                'role' => 'client',
                'title' => 'Welcome to ' . $restaurant->name . '! 🎉',
                'message' => "You've successfully joined {$restaurant->name}'s loyalty program. Start visiting to earn rewards!",
                'type' => 'system',
                'is_read' => false,
            ]);
            
            return response()->json([
                'message' => 'Successfully joined restaurant',
                'loyalty_card' => $card->load('restaurant')
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Join restaurant error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}