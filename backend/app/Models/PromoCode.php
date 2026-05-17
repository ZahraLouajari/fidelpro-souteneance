<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromoCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'code', 'description', 'type', 'value',
        'max_uses', 'used_count', 'expires_at', 'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'expires_at' => 'datetime',
        'value'      => 'decimal:2',
    ];

    // ─── Relations ──────────────────────────────────────────
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function usages()
    {
        return $this->hasMany(PromoCodeUsage::class);
    }

    // ─── Scopes ─────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeValid($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->where(function ($q) {
                $q->whereNull('max_uses')
                  ->orWhereColumn('used_count', '<', 'max_uses');
            });
    }

    // ─── Methods ────────────────────────────────────────────
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function hasReachedMaxUses(): bool
    {
        return $this->max_uses !== null && $this->used_count >= $this->max_uses;
    }

    public function isValid(): bool
    {
        return $this->is_active && !$this->isExpired() && !$this->hasReachedMaxUses();
    }

    public function hasBeenUsedBy(int $clientId): bool
    {
        return $this->usages()->where('client_id', $clientId)->exists();
    }

    /**
     * Generate a unique promo code string.
     */
    public static function generateCode(int $length = 8): string
    {
        do {
            $code = strtoupper(substr(str_replace(['0', 'O', 'I', 'L'], '', md5(uniqid(mt_rand(), true))), 0, $length));
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /**
     * Get a formatted label for the promo value.
     */
    public function getFormattedValueAttribute(): string
    {
        return match ($this->type) {
            'percentage' => $this->value . '%',
            'fixed'      => $this->value . ' MAD',
            'free_item'  => $this->description,
            default      => (string) $this->value,
        };
    }
}
