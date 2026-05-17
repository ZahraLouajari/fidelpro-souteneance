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

    // Relations
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

    // Ajouter une visite
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
            
            // Créer une récompense automatiquement
            Reward::create([
                'client_id' => $this->client_id,
                'restaurant_id' => $this->restaurant_id,
                'loyalty_card_id' => $this->id,
                'description' => $this->restaurant->reward_description,
                'status' => 'available',
            ]);
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

    // Annuler la dernière visite
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

    // Calculer le niveau actuel
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

    // Obtenir le prochain niveau
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

    // Accesseur pour le nom du prochain niveau
    public function getNextLevelNameAttribute()
    {
        return $this->next_level['name'];
    }

    // Accesseur pour les visites restantes
    public function getVisitsToNextLevelAttribute()
    {
        return $this->next_level['needed'];
    }

    // Accesseur pour le pourcentage de progression
    public function getProgressPercentageAttribute()
    {
        $required = $this->restaurant->visits_required;
        $currentLevel = $this->computeLevel();
        
        switch ($currentLevel) {
            case 'bronze':
                return min(100, ($this->current_visits / $required) * 100);
            case 'silver':
                return min(100, (($this->current_visits - $required) / $required) * 100);
            case 'gold':
                return min(100, (($this->current_visits - ($required * 2)) / $required) * 100);
            default:
                return 100;
        }
    }

    // Vérifier si une récompense est débloquée
    public function getHasRewardAttribute()
    {
        return $this->current_visits >= $this->restaurant->visits_required;
    }

    // Obtenir les statistiques complètes
    public function getStatsAttribute()
    {
        return [
            'total_visits' => $this->current_visits,
            'visits_needed' => max(0, $this->restaurant->visits_required - $this->current_visits),
            'current_level' => $this->loyalty_level,
            'next_level' => $this->next_level_name,
            'progress' => round($this->progress_percentage, 1),
            'has_reward' => $this->has_reward,
        ];
    }

    // Scope pour les cartes actives
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Scope pour les cartes complétées
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    // Scope par niveau
    public function scopeByLevel($query, $level)
    {
        return $query->where('loyalty_level', $level);
    }
}