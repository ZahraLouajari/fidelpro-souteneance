<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id', 'name', 'location', 'latitude', 'longitude', 'category', 'image',
        'visits_required', 'reward_description', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function loyaltyCards()
    {
        return $this->hasMany(LoyaltyCard::class);
    }

    public function visits()
    {
        return $this->hasMany(Visit::class);
    }

    public function rewards()
    {
        return $this->hasMany(Reward::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function promoCodes()
    {
        return $this->hasMany(PromoCode::class);
    }
}