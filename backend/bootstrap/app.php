<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\CheckRole;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Faire confiance aux proxys Azure pour l'HTTPS
        $middleware->trustProxies(at: '*');

        // Enregistrer les aliases de middleware
        $middleware->alias([
            'role' => CheckRole::class,
        ]);
        
        // Ajouter le middleware API (optionnel)
        $middleware->api([
            // Vous pouvez ajouter des middlewares globaux pour l'API ici
        ]);
        
        // Configurer CORS pour l'API (optionnel)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Gérer les exceptions JWT
        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\JWTException $e, $request) {
            return response()->json(['error' => 'Token invalide.'], 401);
        });
        
        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e, $request) {
            return response()->json(['error' => 'Token expiré.'], 401);
        });
        
        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e, $request) {
            return response()->json(['error' => 'Token invalide.'], 401);
        });
        
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            return response()->json(['error' => 'Non authentifié.'], 401);
        });
    })->create();