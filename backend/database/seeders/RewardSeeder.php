<?php

namespace Database\Seeders;

use App\Models\Reward;
use App\Models\LoyaltyCard;
use Illuminate\Database\Seeder;

class RewardSeeder extends Seeder
{
    public function run(): void
    {
        // جيب جميع بطاقات الولاء للـ client ID 7
        $cards = LoyaltyCard::where('client_id', 7)->get();

        foreach ($cards as $card) {
            Reward::firstOrCreate(
                [
                    'client_id' => 7,
                    'restaurant_id' => $card->restaurant_id,
                ],
                [
                    'loyalty_card_id' => $card->id,
                    'description' => "Récompense chez " . $card->restaurant->name,
                    'status' => 'available',
                    'redeemed_at' => null,
                ]
            );
        }

        $this->command->info('Rewards created successfully!');
    }
}