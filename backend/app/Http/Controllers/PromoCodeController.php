<?php

namespace App\Http\Controllers;

use App\Models\PromoCode;
use App\Models\PromoCodeUsage;
use App\Models\Restaurant;
use App\Models\CustomNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PromoCodeController extends Controller
{
    // ─── Helper: message multilingue JSON ───────────────────────────────────────
    private function ml(string $fr, string $en, string $ar): string
    {
        return json_encode(['fr' => $fr, 'en' => $en, 'ar' => $ar], JSON_UNESCAPED_UNICODE);
    }

    // ─── Helper: récupère le restaurant du restaurateur connecté ────────────────
    private function requireRestaurant(): Restaurant
    {
        $restaurant = Restaurant::where('owner_id', auth('api')->id())->first();
        if (!$restaurant) {
            abort(404, 'no_restaurant');
        }
        return $restaurant;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // RESTAURANT ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * GET /restaurant/promo-codes — Liste des codes promo du restaurant
     */
    public function index()
    {
        try {
            $restaurant = $this->requireRestaurant();

            $promos = PromoCode::where('restaurant_id', $restaurant->id)
                ->withCount('usages')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($promo) {
                    return [
                        'id'              => $promo->id,
                        'code'            => $promo->code,
                        'description'     => $promo->description,
                        'type'            => $promo->type,
                        'value'           => $promo->value,
                        'formatted_value' => $promo->formatted_value,
                        'max_uses'        => $promo->max_uses,
                        'used_count'      => $promo->used_count,
                        'usages_count'    => $promo->usages_count,
                        'expires_at'      => $promo->expires_at?->format('Y-m-d H:i'),
                        'is_active'       => $promo->is_active,
                        'is_expired'      => $promo->isExpired(),
                        'is_valid'        => $promo->isValid(),
                        'created_at'      => $promo->created_at->format('Y-m-d'),
                    ];
                });

            return response()->json($promos);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /restaurant/promo-codes — Créer un nouveau code promo
     */
    public function store(Request $request)
    {
        try {
            $restaurant = $this->requireRestaurant();

            $validator = Validator::make($request->all(), [
                'code'        => 'nullable|string|max:20|unique:promo_codes,code',
                'description' => 'required|string|max:200',
                'type'        => 'required|in:percentage,fixed,free_item',
                'value'       => 'required_unless:type,free_item|numeric|min:0',
                'max_uses'    => 'nullable|integer|min:1',
                'expires_at'  => 'nullable|date|after:now',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $code = $request->code
                ? strtoupper(trim($request->code))
                : PromoCode::generateCode();

            $promo = PromoCode::create([
                'restaurant_id' => $restaurant->id,
                'code'          => $code,
                'description'   => $request->description,
                'type'          => $request->type,
                'value'         => $request->type === 'free_item' ? 0 : $request->value,
                'max_uses'      => $request->max_uses,
                'expires_at'    => $request->expires_at,
                'is_active'     => true,
            ]);

            return response()->json([
                'message'    => 'Code promo créé avec succès.',
                'promo_code' => $promo,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /restaurant/promo-codes/{id} — Toggle actif/inactif
     */
    public function toggle($id)
    {
        try {
            $restaurant = $this->requireRestaurant();

            $promo = PromoCode::where('restaurant_id', $restaurant->id)->findOrFail($id);
            $promo->update(['is_active' => !$promo->is_active]);

            return response()->json([
                'message'    => $promo->is_active ? 'Code promo activé.' : 'Code promo désactivé.',
                'promo_code' => $promo,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /restaurant/promo-codes/{id} — Supprimer un code promo
     */
    public function destroy($id)
    {
        try {
            $restaurant = $this->requireRestaurant();

            $promo = PromoCode::where('restaurant_id', $restaurant->id)->findOrFail($id);
            $promo->delete();

            return response()->json(['message' => 'Code promo supprimé.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CLIENT ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * POST /client/promo-codes/apply — Appliquer un code promo
     */
    public function apply(Request $request)
    {
        try {
            $user = auth('api')->user();

            $validator = Validator::make($request->all(), [
                'code' => 'required|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $code = strtoupper(trim($request->code));
            $promo = PromoCode::with('restaurant')->where('code', $code)->first();

            if (!$promo) {
                return response()->json(['error' => 'Code promo introuvable.'], 404);
            }

            if (!$promo->is_active) {
                return response()->json(['error' => 'Ce code promo n\'est plus actif.'], 400);
            }

            if ($promo->isExpired()) {
                return response()->json(['error' => 'Ce code promo a expiré.'], 400);
            }

            if ($promo->hasReachedMaxUses()) {
                return response()->json(['error' => 'Ce code promo a atteint son nombre maximum d\'utilisations.'], 400);
            }

            if ($promo->hasBeenUsedBy($user->id)) {
                return response()->json(['error' => 'Vous avez déjà utilisé ce code promo.'], 400);
            }

            // Enregistrer l'utilisation
            PromoCodeUsage::create([
                'promo_code_id' => $promo->id,
                'client_id'     => $user->id,
            ]);

            $promo->increment('used_count');

            $restaurantName = $promo->restaurant->name;

            // Notification → Client
            CustomNotification::create([
                'user_id' => $user->id,
                'role'    => 'client',
                'title'   => $this->ml(
                    'Code promo appliqué! 🎉',
                    'Promo code applied! 🎉',
                    'تم تطبيق رمز الخصم! 🎉'
                ),
                'message' => $this->ml(
                    "Vous avez utilisé le code {$code} chez {$restaurantName}: {$promo->description}",
                    "You used code {$code} at {$restaurantName}: {$promo->description}",
                    "لقد استخدمت الرمز {$code} في {$restaurantName}: {$promo->description}"
                ),
                'type'    => 'reward',
                'is_read' => false,
            ]);

            // Notification → Restaurant
            CustomNotification::create([
                'user_id' => $promo->restaurant->owner_id,
                'role'    => 'restaurant',
                'title'   => $this->ml(
                    'Code promo utilisé! 🏷️',
                    'Promo code used! 🏷️',
                    'تم استخدام رمز الخصم! 🏷️'
                ),
                'message' => $this->ml(
                    "{$user->name} a utilisé le code {$code}. Utilisations: {$promo->used_count}" . ($promo->max_uses ? "/{$promo->max_uses}" : ''),
                    "{$user->name} used code {$code}. Uses: {$promo->used_count}" . ($promo->max_uses ? "/{$promo->max_uses}" : ''),
                    "استخدم {$user->name} الرمز {$code}. الاستخدامات: {$promo->used_count}" . ($promo->max_uses ? "/{$promo->max_uses}" : '')
                ),
                'type'    => 'system',
                'is_read' => false,
            ]);

            return response()->json([
                'message'    => 'Code promo appliqué avec succès!',
                'promo_code' => [
                    'code'            => $promo->code,
                    'description'     => $promo->description,
                    'type'            => $promo->type,
                    'value'           => $promo->value,
                    'formatted_value' => $promo->formatted_value,
                    'restaurant'      => $restaurantName,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /client/promo-codes/history — Historique des codes utilisés par le client
     */
    public function history()
    {
        try {
            $user = auth('api')->user();

            $usages = PromoCodeUsage::with(['promoCode.restaurant'])
                ->where('client_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($usage) {
                    return [
                        'id'              => $usage->id,
                        'code'            => $usage->promoCode->code,
                        'description'     => $usage->promoCode->description,
                        'type'            => $usage->promoCode->type,
                        'value'           => $usage->promoCode->value,
                        'formatted_value' => $usage->promoCode->formatted_value,
                        'restaurant'      => $usage->promoCode->restaurant->name ?? 'N/A',
                        'used_at'         => $usage->created_at->format('Y-m-d H:i'),
                    ];
                });

            return response()->json($usages);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
