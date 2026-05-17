<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Review;
use App\Models\Restaurant;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    public function platformReviews()
    {
        $reviews = Review::where('type', 'platform')
            ->where('is_approved', true)
            ->with('user:id,name,role,avatar')
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get();

        return response()->json($reviews);
    }

    public function restaurantReviews($restaurantId)
    {
        $reviews = Review::where('restaurant_id', $restaurantId)
            ->where('is_approved', true)
            ->with('user:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id' => 'nullable|exists:restaurants,id',
            'rating'        => 'required|integer|min:1|max:5',
            'comment'       => 'required|string|max:500',
            'type'          => 'required|in:platform,restaurant',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();

        // Check if user has already reviewed this restaurant or platform
        $existing = Review::where('user_id', $user->id)
            ->where('type', $request->type)
            ->where('restaurant_id', $request->restaurant_id)
            ->first();

        if ($existing) {
            $existing->update([
                'rating'      => $request->rating,
                'comment'     => $request->comment,
                'is_approved' => $user->role === 'admin' ? true : false, // Reset approval on edit unless admin
            ]);
            return response()->json(['message' => 'Avis mis à jour.', 'review' => $existing]);
        }

        $review = Review::create([
            'user_id'       => $user->id,
            'restaurant_id' => $request->restaurant_id,
            'rating'        => $request->rating,
            'comment'       => $request->comment,
            'type'          => $request->type,
            'is_approved'   => $user->role === 'admin',
        ]);

        return response()->json(['message' => 'Avis ajouté avec succès.', 'review' => $review], 201);
    }
}
