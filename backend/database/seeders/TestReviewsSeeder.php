<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Review;
use App\Models\User;

class TestReviewsSeeder extends Seeder
{
    public function run()
    {
        $reviews = [
            [
                'user_id' => 17, // salma (restaurant)
                'rating' => 5,
                'comment' => "Une plateforme indispensable pour gérer ma clientèle fidèle. Top !",
                'type' => 'platform',
                'is_approved' => true,
            ],
            [
                'user_id' => 18, // kawtar (client)
                'rating' => 5,
                'comment' => "J'adore le concept des récompenses, c'est très motivant pour revenir.",
                'type' => 'platform',
                'is_approved' => true,
            ],
            [
                'user_id' => 15, // ahlambenchahid (restaurant)
                'rating' => 4,
                'comment' => "Interface intuitive et support réactif. Très satisfait.",
                'type' => 'platform',
                'is_approved' => true,
            ],
            [
                'user_id' => 16, // sara (client)
                'rating' => 5,
                'comment' => "C'est devenu mon application préférée pour découvrir de nouveaux restos.",
                'type' => 'platform',
                'is_approved' => true,
            ],
        ];

        foreach ($reviews as $reviewData) {
            Review::create($reviewData);
        }
    }
}
