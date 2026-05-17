#!/bin/bash

# Aller dans le dossier backend
cd /home/site/wwwroot/backend

# Installer les dépendances si nécessaire (Azure le fait souvent automatiquement)
# composer install --no-dev --optimize-autoloader

# Exécuter les migrations de la base de données
php artisan migrate --force

# Démarrer le serveur (dépend de la configuration Azure, souvent Apache ou Nginx est déjà configuré)
# Pour une Web App Linux standard avec PHP :
cp /home/site/wwwroot/backend/public/.htaccess /home/site/wwwroot/public/.htaccess 2>/dev/null || true
