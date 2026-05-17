<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Code de vérification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .logo h1 {
            color: #f97316;
            font-size: 24px;
            text-align: center;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            background: #fef3c7;
            border-radius: 8px;
            letter-spacing: 5px;
            color: #f97316;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🍽️ FidélitéPro</h1>
        </div>
        
        <h2>Bonjour,</h2>
        
        @if(isset($isPasswordReset) && $isPasswordReset)
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p>Voici votre code de vérification :</p>
        @else
            <p>Bienvenue sur FidélitéPro!</p>
            <p>Voici votre code de vérification :</p>
        @endif
        
        <div class="code">
            {{ $code ?? 'XXXXXX' }}
        </div>
        
        <p>Ce code expire dans <strong>15 minutes</strong>.</p>
        
        <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} FidélitéPro. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>