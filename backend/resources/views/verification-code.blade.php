<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verification Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #f0f0f0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #c2410c;
        }
        .content {
            padding: 30px 20px;
            text-align: center;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #c2410c;
            background-color: #fff7ed;
            padding: 15px;
            border-radius: 8px;
            display: inline-block;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #f0f0f0;
        }
        .button {
            background-color: #c2410c;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">FidélitéPro</div>
        </div>
        
        <div class="content">
            <h2>Hello {{ $name }}!</h2>
            
            @if($isPasswordReset)
                <p>You requested to reset your password. Use the code below to verify your identity:</p>
            @else
                <p>Thank you for registering with FidélitéPro. Use the code below to verify your email address:</p>
            @endif
            
            <div class="code">
                {{ $code }}
            </div>
            
            <p>This code will expire in <strong>15 minutes</strong>.</p>
            
            <p>If you didn't request this, please ignore this email.</p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} FidélitéPro. All rights reserved.</p>
        </div>
    </div>
</body>
</html>