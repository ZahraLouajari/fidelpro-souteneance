<?php

namespace Database\Seeders;

use App\Models\CustomNotification;
use App\Models\User;
use Illuminate\Database\Seeder;

class CustomNotificationSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        
        foreach ($users as $user) {
            // Client notifications
            if ($user->role === 'client') {
                CustomNotification::create([
                    'user_id' => $user->id,
                    'role' => 'client',
                    'title' => 'Welcome to FidélitéPro! 🎉',
                    'message' => 'Start earning points with every visit to your favorite restaurants.',
                    'type' => 'system',
                    'is_read' => false,
                ]);
                
                CustomNotification::create([
                    'user_id' => $user->id,
                    'role' => 'client',
                    'title' => 'Points Added! ⭐',
                    'message' => 'You earned 10 points for your first visit.',
                    'type' => 'points',
                    'is_read' => false,
                ]);
            }
            
            // Restaurant notifications
            if ($user->role === 'restaurant') {
                CustomNotification::create([
                    'user_id' => $user->id,
                    'role' => 'restaurant',
                    'title' => 'Welcome! 🍽️',
                    'message' => 'Start managing your loyalty program and reward your customers.',
                    'type' => 'system',
                    'is_read' => false,
                ]);
            }
            
            // Admin notifications
            if ($user->role === 'admin') {
                CustomNotification::create([
                    'user_id' => $user->id,
                    'role' => 'admin',
                    'title' => 'New Activity',
                    'message' => 'A new restaurant has joined the platform.',
                    'type' => 'system',
                    'is_read' => false,
                ]);
            }
        }
    }
}