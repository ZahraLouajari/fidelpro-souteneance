<?php
namespace Database\Seeders;

use App\Models\User;
use App\Models\Restaurant;
use App\Models\LoyaltyCard;
use App\Models\Visit;
use App\Models\Reward;
use App\Models\CustomNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Admin ──
        $admin = User::updateOrCreate(
            ['email' => 'admin@demo.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('demo'),
                'role' => 'admin',
                'email_verified_at' => now(),
                'is_blocked' => false,
            ]
        );

        // ── 2. Restaurant Owners + Restaurants ──
        $restaurantsData = [
            [
                'owner' => ['name' => 'Pierre Dupont',  'email' => 'pierre@demo.com'],
                'resto' => [
                    'name' => 'Le Petit Bistro',
                    'location' => 'Paris, 6th Arr.',
                    'category' => 'French',
                    'visits_required' => 10,
                    'reward_description' => 'Dîner gratuit pour deux'
                ],
            ],
            [
                'owner' => ['name' => 'Yuki Tanaka',    'email' => 'yuki@demo.com'],
                'resto' => [
                    'name' => 'Sakura Garden',
                    'location' => 'Tokyo, Shibuya',
                    'category' => 'Japanese',
                    'visits_required' => 8,
                    'reward_description' => 'Omakase gratuit'
                ],
            ],
            [
                'owner' => ['name' => 'Marco Ferrari',  'email' => 'marco@demo.com'],
                'resto' => [
                    'name' => 'Trattoria Roma',
                    'location' => 'Rome, Trastevere',
                    'category' => 'Italian',
                    'visits_required' => 6,
                    'reward_description' => 'Pizza offerte'
                ],
            ],
            [
                'owner' => ['name' => 'Carlos Mendez',  'email' => 'carlos@demo.com'],
                'resto' => [
                    'name' => 'El Taco Loco',
                    'location' => 'Madrid, Centro',
                    'category' => 'Mexican',
                    'visits_required' => 7,
                    'reward_description' => 'Burrito gratuit'
                ],
            ],
            [
                'owner' => ['name' => 'Fatima Zahra',   'email' => 'fatima@demo.com'],
                'resto' => [
                    'name' => 'Dar Zitoun',
                    'location' => 'Marrakech, Medina',
                    'category' => 'Moroccan',
                    'visits_required' => 9,
                    'reward_description' => 'Tajine offert'
                ],
            ],
            [
                'owner' => ['name' => 'Restaurant Demo','email' => 'restaurant@demo.com'],
                'resto' => [
                    'name' => 'Restaurant Demo',
                    'location' => 'Demo City',
                    'category' => 'General',
                    'visits_required' => 10,
                    'reward_description' => 'Free meal'
                ],
            ],
        ];

        $restaurants = [];
        $owners = [];

        foreach ($restaurantsData as $data) {
            $owner = User::updateOrCreate(
                ['email' => $data['owner']['email']],
                [
                    'name' => $data['owner']['name'],
                    'password' => Hash::make('demo'),
                    'role' => 'restaurant',
                    'email_verified_at' => now(),
                    'is_blocked' => false,
                ]
            );
            $owners[] = $owner;

            $restaurant = Restaurant::updateOrCreate(
                ['owner_id' => $owner->id],
                [
                    'name' => $data['resto']['name'],
                    'location' => $data['resto']['location'],
                    'category' => $data['resto']['category'],
                    'visits_required' => $data['resto']['visits_required'],
                    'reward_description' => $data['resto']['reward_description'],
                    'is_active' => true,
                ]
            );
            $restaurants[] = $restaurant;
        }

        // ── 3. Clients ──
        $clientsData = [
            ['name' => 'Alice Martin',   'email' => 'client@demo.com'],
            ['name' => 'James Wilson',   'email' => 'james@demo.com'],
            ['name' => 'Sophie Dubois',  'email' => 'sophie@demo.com'],
            ['name' => 'Emma Chen',      'email' => 'emma@demo.com'],
            ['name' => 'Karim Benali',   'email' => 'karim@demo.com'],
        ];

        $clients = [];
        foreach ($clientsData as $data) {
            $client = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('demo'),
                    'role' => 'client',
                    'email_verified_at' => now(),
                    'is_blocked' => false,
                ]
            );
            $clients[] = $client;
        }

        // ── 4. Loyalty Cards + Visits + Rewards + Notifications ──
        foreach ($clients as $client) {
            foreach ($restaurants as $resto) {
                $visitsCount = rand(2, 12);
                $level = $this->getLevel($visitsCount);
                
                $card = LoyaltyCard::updateOrCreate(
                    [
                        'client_id' => $client->id,
                        'restaurant_id' => $resto->id,
                    ],
                    [
                        'current_visits' => $visitsCount,
                        'status' => $visitsCount >= $resto->visits_required ? 'completed' : 'active',
                        'loyalty_level' => $level,
                        'last_visit_at' => now()->subDays(rand(1, 30)),
                    ]
                );

                Visit::where('loyalty_card_id', $card->id)->delete();
                
                for ($i = 0; $i < $visitsCount; $i++) {
                    Visit::create([
                        'client_id' => $client->id,
                        'restaurant_id' => $resto->id,
                        'loyalty_card_id' => $card->id,
                        'points' => 1,
                        'created_at' => now()->subDays(rand(1, 60)),
                    ]);
                }

                if ($visitsCount >= $resto->visits_required) {
                    Reward::updateOrCreate(
                        [
                            'client_id' => $client->id,
                            'restaurant_id' => $resto->id,
                        ],
                        [
                            'loyalty_card_id' => $card->id,
                            'description' => $resto->reward_description,
                            'status' => rand(0, 1) ? 'available' : 'redeemed',
                            'redeemed_at' => rand(0, 1) ? now()->subDays(rand(1, 10)) : null,
                        ]
                    );
                }
            }

            // ── Client Notifications (sans 'role') ──
            CustomNotification::updateOrCreate(
                ['user_id' => $client->id, 'title' => 'Bienvenue sur FidélitéPro! 🎉'],
                [
                    'message' => 'Votre compte est prêt. Commencez à gagner des points dès maintenant!',
                    'type' => 'system',
                    'is_read' => false,
                ]
            );
            CustomNotification::updateOrCreate(
                ['user_id' => $client->id, 'title' => 'Points gagnés! ⭐'],
                [
                    'message' => 'Vous avez gagné 10 points pour votre première visite.',
                    'type' => 'points',
                    'is_read' => false,
                ]
            );
            CustomNotification::updateOrCreate(
                ['user_id' => $client->id, 'title' => 'Nouvelle visite enregistrée ✅'],
                [
                    'message' => 'Votre visite a été validée. Continuez comme ça!',
                    'type' => 'visit',
                    'is_read' => false,
                ]
            );
            CustomNotification::updateOrCreate(
                ['user_id' => $client->id, 'title' => 'Récompense disponible! 🎁'],
                [
                    'message' => 'Vous avez débloqué une récompense! Rendez-vous dans l\'onglet Rewards.',
                    'type' => 'reward',
                    'is_read' => false,
                ]
            );
        }

        // ── Restaurant Notifications (sans 'role') ──
        foreach ($owners as $index => $owner) {
            $resto = $restaurants[$index] ?? null;
            if (!$resto) continue;

            CustomNotification::updateOrCreate(
                ['user_id' => $owner->id, 'title' => 'Bienvenue sur FidélitéPro! 🎉'],
                [
                    'message' => "Votre restaurant {$resto->name} est maintenant actif sur la plateforme.",
                    'type' => 'system',
                    'is_read' => false,
                ]
            );
            CustomNotification::updateOrCreate(
                ['user_id' => $owner->id, 'title' => 'Nouveau client inscrit 👤'],
                [
                    'message' => "Un nouveau client a rejoint le programme de fidélité de {$resto->name}.",
                    'type' => 'system',
                    'is_read' => false,
                ]
            );
            CustomNotification::updateOrCreate(
                ['user_id' => $owner->id, 'title' => 'Visite enregistrée ✅'],
                [
                    'message' => "Une nouvelle visite a été enregistrée dans {$resto->name}.",
                    'type' => 'visit',
                    'is_read' => false,
                ]
            );
            CustomNotification::updateOrCreate(
                ['user_id' => $owner->id, 'title' => 'Récompense réclamée 🎁'],
                [
                    'message' => "Un client a réclamé sa récompense: {$resto->reward_description}.",
                    'type' => 'reward',
                    'is_read' => false,
                ]
            );
        }

        // ── Admin Notifications (sans 'role') ──
        CustomNotification::updateOrCreate(
            ['user_id' => $admin->id, 'title' => 'Plateforme initialisée 🚀'],
            [
                'message' => '5 restaurants et 5 clients ont rejoint la plateforme.',
                'type' => 'system',
                'is_read' => false,
            ]
        );
        CustomNotification::updateOrCreate(
            ['user_id' => $admin->id, 'title' => 'Nouveau restaurant inscrit 🍽️'],
            [
                'message' => 'Un nouveau restaurant vient de rejoindre la plateforme.',
                'type' => 'system',
                'is_read' => false,
            ]
        );
        CustomNotification::updateOrCreate(
            ['user_id' => $admin->id, 'title' => 'Rapport mensuel disponible 📊'],
            [
                'message' => 'Consultez les statistiques du mois dans l\'onglet Analytics.',
                'type' => 'system',
                'is_read' => false,
            ]
        );
        CustomNotification::updateOrCreate(
            ['user_id' => $admin->id, 'title' => 'Nouvelle inscription client 👤'],
            [
                'message' => 'Un nouveau client a créé un compte sur la plateforme.',
                'type' => 'system',
                'is_read' => false,
            ]
        );

        $this->command->info("✅ Seed terminé: 1 admin, " . count($owners) . " restaurateurs, " . count($clients) . " clients, " . count($restaurants) . " restaurants");
    }

    private function getLevel($visits): string
    {
        if ($visits >= 20) return 'vip';
        if ($visits >= 10) return 'gold';
        if ($visits >= 5) return 'silver';
        return 'bronze';
    }
}