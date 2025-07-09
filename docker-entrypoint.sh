#!/bin/sh
set -e

# Script d'entrée pour le container RegisFlow
echo "🚀 Démarrage de RegisFlow..."

# Attendre que la base de données soit prête
echo "📡 Attente de la base de données..."
until pg_isready -h postgres -p 5432 -U regisflow; do
  echo "⏳ Base de données non prête, attente de 5 secondes..."
  sleep 5
done

echo "✅ Base de données prête!"

# Exécuter les migrations de base de données
echo "🔄 Exécution des migrations..."
npx drizzle-kit push:pg

# Créer le répertoire des sauvegardes s'il n'existe pas
mkdir -p /app/backups

# Démarrer l'application
echo "🎯 Démarrage de l'application RegisFlow..."
exec "$@"