<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'restaurant_id',
        'current_visits',
        'status',
        'loyalty_level',
        'last_visit_at'
    ];

    protected $casts = [
        'last_visit_at' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function visits()
    {
        return $this->hasMany(Visit::class);
    }

    public function rewards()
    {
        return $this->hasMany(Reward::class);
    }

    public function addVisit()
    {
        $this->current_visits++;
        $this->last_visit_at = now();
        
        // Update loyalty level based on visits
        $required = $this->restaurant->visits_required;
        if ($this->current_visits >= $required * 3) {
            $this->loyalty_level = 'vip';
        } elseif ($this->current_visits >= $required * 2) {
            $this->loyalty_level = 'gold';
        } elseif ($this->current_visits >= $required) {
            $this->loyalty_level = 'silver';
        } else {
            $this->loyalty_level = 'bronze';
        }
        
        if ($this->current_visits >= $required && $this->status === 'active') {
            $this->status = 'completed';
        }
        
        $this->save();
        
        return Visit::create([
            'client_id' => $this->client_id,
            'restaurant_id' => $this->restaurant_id,
            'loyalty_card_id' => $this->id,
            'points' => 10,
            'is_cancelled' => false,
        ]);
    }

    public function cancelLastVisit()
    {
        $lastVisit = $this->visits()
            ->where('is_cancelled', false)
            ->latest()
            ->first();

        if (!$lastVisit) {
            return false;
        }

        $lastVisit->update(['is_cancelled' => true]);
        
        $this->current_visits--;
        
        // Update loyalty level
        $required = $this->restaurant->visits_required;
        if ($this->current_visits >= $required * 3) {
            $this->loyalty_level = 'vip';
        } elseif ($this->current_visits >= $required * 2) {
            $this->loyalty_level = 'gold';
        } elseif ($this->current_visits >= $required) {
            $this->loyalty_level = 'silver';
        } else {
            $this->loyalty_level = 'bronze';
        }
        
        if ($this->current_visits < $required) {
            $this->status = 'active';
        }
        
        $this->save();
        
        return true;
    }

    // Add this method
    public function computeLevel()
    {
        $required = $this->restaurant->visits_required;
        
        if ($this->current_visits >= $required * 3) {
            return 'vip';
        } elseif ($this->current_visits >= $required * 2) {
            return 'gold';
        } elseif ($this->current_visits >= $required) {
            return 'silver';
        }
        return 'bronze';
    }

    // Add this accessor
    public function getNextLevelAttribute()
    {
        $currentLevel = $this->computeLevel();
        $required = $this->restaurant->visits_required;
        
        switch ($currentLevel) {
            case 'bronze':
                return [
                    'name' => 'Silver',
                    'needed' => $required - $this->current_visits
                ];
            case 'silver':
                return [
                    'name' => 'Gold',
                    'needed' => ($required * 2) - $this->current_visits
                ];
            case 'gold':
                return [
                    'name' => 'VIP',
                    'needed' => ($required * 3) - $this->current_visits
                ];
            default:
                return [
                    'name' => 'Max Level',
                    'needed' => 0
                ];
        }
    }
}