<?php

namespace App\Http\Controllers;

use App\Models\CustomNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $user = auth()->user();
            
            $notifications = CustomNotification::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
                
            return response()->json([
                'notifications' => $notifications,
                'unread_count' => $notifications->where('is_read', false)->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Notifications error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get unread notifications count
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function unreadCount()
    {
        try {
            $user = auth()->user();
            
            $count = CustomNotification::where('user_id', $user->id)
                ->where('is_read', false)
                ->count();
                
            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            \Log::error('UnreadCount error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mark a specific notification as read
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead($id)
    {
        try {
            $user = auth()->user();
            
            $notification = CustomNotification::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();
                
            $notification->update(['is_read' => true]);
            
            return response()->json(['message' => 'Notification marked as read']);
        } catch (\Exception $e) {
            \Log::error('MarkAsRead error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mark all notifications as read
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead()
    {
        try {
            $user = auth()->user();
            
            CustomNotification::where('user_id', $user->id)
                ->where('is_read', false)
                ->update(['is_read' => true]);
                
            return response()->json(['message' => 'All notifications marked as read']);
        } catch (\Exception $e) {
            \Log::error('MarkAllAsRead error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a notification
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $user = auth()->user();
            
            $notification = CustomNotification::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();
                
            $notification->delete();
            
            return response()->json(['message' => 'Notification deleted']);
        } catch (\Exception $e) {
            \Log::error('Destroy error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}