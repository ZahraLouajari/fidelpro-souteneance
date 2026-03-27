<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = auth('api')->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json(['error' => 'Accès non autorisé.'], 403);
        }

        if ($user->is_blocked) {
            return response()->json(['error' => 'Votre compte est bloqué.'], 403);
        }

        return $next($request);
    }
}