<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    /**
     * Award points to a user and update their level automatically.
     *
     * @param  User  $user
     * @param  int   $amount
     * @return \Illuminate\Http\JsonResponse
     */
    public function awardPoints(User $user, $amount)
    {
        // Update points
        $user->points += $amount;
        $user->save();

        // Automatically update level based on thresholds
        $levelChanged = $user->updateLevel();

        return response()->json([
            'message' => 'Points awarded successfully.',
            'user' => [
                'name' => $user->name,
                'points' => $user->points,
                'level' => $user->level,
                'level_changed' => $levelChanged
            ]
        ]);
    }
}
