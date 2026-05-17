<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\VerificationCode;
use App\Models\CustomNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use App\Mail\VerificationCodeMail;

class AuthController extends Controller
{
    // ==================== REGISTER WITH VERIFICATION CODE ====================
    
    public function requestVerificationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'name' => 'required|string|max:255',
            'role' => 'required|in:client,restaurant',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Delete existing codes for this email
            VerificationCode::where('email', $request->email)->delete();
            
            // Generate 6-digit code
            $code = rand(100000, 999999);
            
            // Save verification code
            VerificationCode::create([
                'email' => $request->email,
                'code' => $code,
                'expires_at' => now()->addMinutes(15),
            ]);
            
            // Send email with code
            Mail::to($request->email)->send(new VerificationCodeMail($code, $request->name));
            
            return response()->json([
                'message' => 'Verification code sent to your email',
                'email' => $request->email
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Request verification code error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to send verification code'], 500);
        }
    }
    
    public function verifyCodeAndRegister(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:client,restaurant',
            'phone' => 'nullable|string|max:20',
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            // Verify code
            $verification = VerificationCode::where('email', $request->email)
                ->where('code', $request->code)
                ->where('expires_at', '>', now())
                ->first();
                
            if (!$verification) {
                return response()->json(['error' => 'Invalid or expired verification code'], 400);
            }
            
            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'phone' => $request->phone,
                'email_verified_at' => now(),
                'is_blocked' => false,
            ]);
            
            // Delete used verification code
            $verification->delete();
            
            // Create token
            $token = Auth::login($user);
            
            // Send welcome notification
            CustomNotification::create([
                'user_id' => $user->id,
                'role' => $user->role,
                'title' => 'Welcome to FidélitéPro! 🎉',
                'message' => 'Your account has been successfully verified. Start exploring our loyalty program!',
                'type' => 'system',
                'is_read' => false,
            ]);
            
            return response()->json([
                'message' => 'Registration successful',
                'user' => $user,
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth()->factory()->getTTL() * 60
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Verify and register error: ' . $e->getMessage());
            return response()->json(['error' => 'Registration failed'], 500);
        }
    }
    
    // ==================== FORGOT PASSWORD WITH VERIFICATION CODE ====================
    
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $user = User::where('email', $request->email)->first();
        
        // Delete existing codes
        VerificationCode::where('email', $request->email)->delete();
        
        // Generate 6-digit code
        $code = rand(100000, 999999);
        
        // Save verification code
        VerificationCode::create([
            'email' => $request->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(15),
        ]);
        
        // Send email with code
        try {
            Mail::to($request->email)->send(new VerificationCodeMail($code, $user->name ?? 'Client', true));
        } catch (\Exception $e) {
            \Log::error('Email sending failed: ' . $e->getMessage());
        }
        
        return response()->json([
            'message' => 'Password reset code sent to your email',
            'email' => $request->email
        ]);
    }
    
    public function verifyCodeAndResetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            // Verify code
            $verification = VerificationCode::where('email', $request->email)
                ->where('code', $request->code)
                ->where('expires_at', '>', now())
                ->first();
                
            if (!$verification) {
                return response()->json(['error' => 'Invalid or expired verification code'], 400);
            }
            
            // Update password
            $user = User::where('email', $request->email)->first();
            $user->password = Hash::make($request->password);
            $user->save();
            
            // Delete used verification code
            $verification->delete();
            
            // Send notification
            CustomNotification::create([
                'user_id' => $user->id,
                'role' => $user->role,
                'title' => 'Password Changed 🔒',
                'message' => 'Your password has been successfully changed.',
                'type' => 'system',
                'is_read' => false,
            ]);
            
            return response()->json([
                'message' => 'Password reset successfully'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Verify and reset password error: ' . $e->getMessage());
            return response()->json(['error' => 'Password reset failed'], 500);
        }
    }
    
    // ==================== STANDARD AUTH METHODS ====================
    
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $credentials = $request->only('email', 'password');
        
        if (!$token = Auth::attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }
        
        $user = Auth::user();
        
        if ($user->is_blocked) {
            Auth::logout();
            return response()->json(['error' => 'Your account has been blocked'], 403);
        }
        
        return response()->json([
            'user' => $user,
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60
        ]);
    }
    
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:client,restaurant',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'email_verified_at' => now(),
            'is_blocked' => false,
        ]);
        
        $token = Auth::login($user);
        
        return response()->json([
            'user' => $user,
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60
        ], 201);
    }
    
    public function logout()
    {
        Auth::logout();
        return response()->json(['message' => 'Successfully logged out']);
    }
    
    public function refresh()
    {
        return response()->json([
            'token' => Auth::refresh(),
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60
        ]);
    }
    
    public function me()
    {
        return response()->json(['user' => Auth::user()]);
    }
    
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'avatar' => 'sometimes|image|mimes:jpg,jpeg,png|max:2048',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        if ($request->has('name')) {
            $user->name = $request->name;
        }
        
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }
        
        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');
            $avatarName = time() . '_' . $user->id . '.' . $avatar->getClientOriginalExtension();
            $avatar->move(public_path('avatars'), $avatarName);
            $user->avatar = '/avatars/' . $avatarName;
        }
        
        $user->save();
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }
    
    // ==================== ALIAS METHOD FOR RESET PASSWORD ====================
    
    /**
     * Alias method for reset password (calls verifyCodeAndResetPassword)
     * This allows the frontend to use 'resetPassword' endpoint
     */
    public function resetPassword(Request $request)
    {
        return $this->verifyCodeAndResetPassword($request);
    }
}