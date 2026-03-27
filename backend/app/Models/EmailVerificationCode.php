<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailVerificationCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'email', 'code', 'type', 'is_used', 'expires_at'
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function isValid(): bool
    {
        return !$this->is_used && $this->expires_at->isFuture();
    }
}