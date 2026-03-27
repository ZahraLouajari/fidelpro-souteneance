<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use Illuminate\Database\Seeder;

class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $restaurants = [
            ['name' => 'Le Petit Paris', 'location' => 'Paris', 'category' => 'Français', 'visits_required' => 8, 'reward_description' => 'Dîner aux chandelles'],
            ['name' => 'Sakura Tokyo', 'location' => 'Tokyo', 'category' => 'Japonais', 'visits_required' => 7, 'reward_description' => 'Omakase premium'],
            ['name' => 'Trattoria Roma', 'location' => 'Rome', 'category' => 'Italien', 'visits_required' => 6, 'reward_description' => 'Pâtes maison'],
            // Ajoutez plus de restaurants ici
        ];

        foreach ($restaurants as $data) {
            Restaurant::create([
                'owner_id' => 2, // ID d'un propriétaire existant
                'name' => $data['name'],
                'location' => $data['location'],
                'category' => $data['category'],
                'visits_required' => $data['visits_required'],
                'reward_description' => $data['reward_description'],
                'is_active' => true,
            ]);
        }
    }
}