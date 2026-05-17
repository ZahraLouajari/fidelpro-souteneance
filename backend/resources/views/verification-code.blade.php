<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Code de vérification</title>
</head>
<body>
    <h2>Bonjour {{ $name }},</h2>
    <p>Voici votre code de vérification :</p>
    <h1 style="font-size: 32px; letter-spacing: 5px;">{{ $code }}</h1>
    <p>Ce code expire dans 15 minutes.</p>
    <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    <p>Cordialement,<br>L'équipe FidélitéPro</p>
</body>
</html>