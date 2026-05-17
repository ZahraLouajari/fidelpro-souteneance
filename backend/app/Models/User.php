<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'phone', 'avatar', 'is_blocked', 'points', 'level', 'referral_code',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_blocked' => 'boolean',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::creating(function ($user) {
            $user->referral_code = self::generateReferralCode();
        });
    }

    /**
     * Generate a unique referral code.
     */
    public static function generateReferralCode()
    {
        do {
            $code = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
        } while (self::where('referral_code', $code)->exists());

        return $code;
    }

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return ['role' => $this->role];
    }

    // Relations
    public function ownedRestaurants()
    {
        return $this->hasMany(Restaurant::class, 'owner_id');
    }

    public function loyaltyCards()
    {
        return $this->hasMany(LoyaltyCard::class, 'client_id');
    }

    public function visits()
    {
        return $this->hasMany(Visit::class, 'client_id');
    }

    public function rewards()
    {
        return $this->hasMany(Reward::class, 'client_id');
    }

    public function customNotifications()
    {
        return $this->hasMany(CustomNotification::class, 'user_id');
    }

    public function referrals()
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    public function referredBy()
    {
        return $this->hasOne(Referral::class, 'referred_id');
    }

    // Scopes
    public function scopeClients($query)
    {
        return $query->where('role', 'client');
    }

    public function scopeRestaurantOwners($query)
    {
        return $query->where('role', 'restaurant');
    }

    public function scopeActive($query)
    {
        return $query->where('is_blocked', false);
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    // Accesseurs
    public function getIsAdminAttribute()
    {
        return $this->role === 'admin';
    }

    public function getIsRestaurantAttribute()
    {
        return $this->role === 'restaurant';
    }

    public function getIsClientAttribute()
    {
        return $this->role === 'client';
    }

    public function getTotalPointsAttribute()
    {
        return $this->loyaltyCards->sum('current_visits') * 10;
    }

    public function getTotalVisitsAttribute()
    {
        return $this->loyaltyCards->sum('current_visits');
    }

    public function getRestaurantsCountAttribute()
    {
        return $this->loyaltyCards->count();
    }

    public function getActiveCardsCountAttribute()
    {
        return $this->loyaltyCards->where('status', 'active')->count();
    }

    public function getCompletedCardsCountAttribute()
    {
        return $this->loyaltyCards->where('status', 'completed')->count();
    }

    public function getAvailableRewardsCountAttribute()
    {
        return $this->rewards->where('status', 'available')->count();
    }

    public function getRedeemedRewardsCountAttribute()
    {
        return $this->rewards->where('status', 'redeemed')->count();
    }

    public function getAvatarUrlAttribute()
    {
        if ($this->avatar) {
            return asset($this->avatar);
        }
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=f97316&color=fff';
    }

    // Méthodes utilitaires
    public function hasRestaurant($restaurantId)
    {
        return $this->loyaltyCards()->where('restaurant_id', $restaurantId)->exists();
    }

    public function getLoyaltyCardForRestaurant($restaurantId)
    {
        return $this->loyaltyCards()->where('restaurant_id', $restaurantId)->first();
    }

    public function getWeeklyVisits()
    {
        $daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $weeklyData = [];

        foreach ($daysOfWeek as $day) {
            $weeklyData[] = ['day' => $day, 'visits' => 0];
        }

        $visits = $this->visits()
            ->where('created_at', '>=', now()->subDays(7))
            ->get();

        foreach ($visits as $visit) {
            $dayIndex = date('N', strtotime($visit->created_at)) - 1;
            if ($dayIndex >= 0 && $dayIndex < 7) {
                $weeklyData[$dayIndex]['visits']++;
            }
        }

        return $weeklyData;
    }

    public function getLevelDistribution()
    {
        $levels = ['bronze', 'silver', 'gold', 'vip'];
        $distribution = [];

        foreach ($levels as $level) {
            $distribution[$level] = $this->loyaltyCards
                ->where('loyalty_level', $level)
                ->count();
        }

        return $distribution;
    }

    /**
     * Update the user's level based on current points.
     */
    public function updateLevel()
    {
        $oldLevel = $this->level;
        
        if ($this->points >= 500) {
            $this->level = 'Gold';
        } elseif ($this->points >= 100) {
            $this->level = 'Silver';
        } else {
            $this->level = 'Bronze';
        }

        if ($oldLevel !== $this->level) {
            $this->save();
            return true; // Level changed
        }

        return false; // Level remained the same
    }
}