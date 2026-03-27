<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visit extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'restaurant_id', 'loyalty_card_id', 'points', 'note', 'is_cancelled',
    ];

    protected $casts = [
        'is_cancelled' => 'boolean',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function loyaltyCard()
    {
        return $this->belongsTo(LoyaltyCard::class);
    }
}