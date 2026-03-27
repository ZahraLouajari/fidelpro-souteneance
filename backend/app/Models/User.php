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
        'name', 'email', 'password', 'role', 'phone', 'avatar', 'is_blocked',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_blocked' => 'boolean',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return ['role' => $this->role];
    }

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
}