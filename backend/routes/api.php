<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\PromoCodeController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==================== PUBLIC ROUTES ====================
Route::prefix('auth')->group(function () {
    Route::post('request-verification-code', [AuthController::class, 'requestVerificationCode']);
    Route::post('verify-code-and-register',  [AuthController::class, 'verifyCodeAndRegister']);
    Route::post('verify-code-and-reset-password', [AuthController::class, 'verifyCodeAndResetPassword']);

    Route::post('register',        [AuthController::class, 'register']);
    Route::post('login',           [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password',  [AuthController::class, 'resetPassword']);
});

// Reviews (Public)
Route::get('reviews/platform', [ReviewController::class, 'platformReviews']);
Route::get('reviews/restaurant/{restaurantId}', [ReviewController::class, 'restaurantReviews']);

// ==================== AUTHENTICATED ROUTES ====================
Route::middleware('auth:api')->group(function () {

    // Auth Actions
    Route::prefix('auth')->group(function () {
        Route::post('logout',  [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me',       [AuthController::class, 'me']);
        Route::put('profile',  [AuthController::class, 'updateProfile']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/',            [NotificationController::class, 'index']);
        Route::get('unread-count', [NotificationController::class, 'unreadCount']);
        Route::put('{id}/read',    [NotificationController::class, 'markAsRead']);
        Route::put('read-all',     [NotificationController::class, 'markAllAsRead']);
        Route::delete('{id}',      [NotificationController::class, 'destroy']);
    });

    // Reviews (Auth)
    Route::post('reviews', [ReviewController::class, 'store']);

    // ==================== CLIENT ROUTES ====================
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('dashboard',                        [ClientController::class, 'dashboard']);
        Route::get('loyalty-cards',                    [ClientController::class, 'loyaltyCards']);
        Route::post('loyalty-cards/{cardId}/cancel-visit', [ClientController::class, 'cancelVisit']);
        Route::get('rewards',                          [ClientController::class, 'rewards']);
        Route::post('rewards/{rewardId}/redeem',       [ClientController::class, 'redeemReward']);
        Route::post('join-restaurant',                 [ClientController::class, 'joinRestaurant']);

        // Promo Codes (Client)
        Route::post('promo-codes/apply',               [PromoCodeController::class, 'apply']);
        Route::get('promo-codes/history',              [PromoCodeController::class, 'history']);
    });

    // ==================== RESTAURANT ROUTES ====================
    // 💡 REMARQUE: Ila bqa kiy-tla3 404, t-akkedi bli l-User role f database mktoub "restaurant"
    Route::middleware('role:restaurant')->prefix('restaurant')->group(function () {
        Route::get('dashboard',               [RestaurantController::class, 'dashboard']);
        Route::post('create',                 [RestaurantController::class, 'createRestaurant']);
        Route::get('clients',                 [RestaurantController::class, 'clients']);
        Route::post('clients/add',            [RestaurantController::class, 'addClient']);
        Route::post('clients/bulk-add',       [RestaurantController::class, 'bulkAddClients']);
        Route::get('clients/{clientId}/info', [RestaurantController::class, 'clientInfo']);
        Route::post('clients/{clientId}/block', [RestaurantController::class, 'blockClient']);
        Route::post('visits/add',             [RestaurantController::class, 'addVisit']);
        Route::put('settings',                [RestaurantController::class, 'updateRestaurant']);
        Route::get('stats/weekly',            [RestaurantController::class, 'weeklyStats']);

        // Promo Codes (Restaurant)
        Route::get('promo-codes',             [PromoCodeController::class, 'index']);
        Route::post('promo-codes',            [PromoCodeController::class, 'store']);
        Route::put('promo-codes/{id}',        [PromoCodeController::class, 'toggle']);
        Route::delete('promo-codes/{id}',     [PromoCodeController::class, 'destroy']);
    });

    // ==================== ADMIN ROUTES ====================
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('dashboard',                      [AdminController::class, 'dashboard']);
        Route::get('clients',                        [AdminController::class, 'clients']);
        Route::get('restaurants',                    [AdminController::class, 'restaurants']);
        Route::get('analytics/owners',               [AdminController::class, 'restaurantOwners']);
        Route::post('users/{userId}/toggle-block',   [AdminController::class, 'toggleBlockUser']);
        Route::delete('users/{userId}',              [AdminController::class, 'deleteUser']);
        Route::post('restaurants',                   [AdminController::class, 'addRestaurant']);
        Route::post('restaurants/bulk',              [AdminController::class, 'bulkAddRestaurants']);
        Route::delete('restaurants/{restaurantId}', [AdminController::class, 'deleteRestaurant']);
        Route::get('analytics/monthly-growth',       [AdminController::class, 'monthlyGrowth']);
        Route::get('analytics/categories',           [AdminController::class, 'categoryDistribution']);
        Route::get('analytics/top-clients',          [AdminController::class, 'topClients']);
        
        // Moderation
        Route::get('reviews/pending',                [AdminController::class, 'pendingReviews']);
        Route::post('reviews/{reviewId}/approve',    [AdminController::class, 'approveReview']);
        Route::delete('reviews/{reviewId}',          [AdminController::class, 'deleteReview']);
    });
});