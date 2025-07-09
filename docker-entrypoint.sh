#!/bin/sh
set -e

# Script d'entrée pour le container RegisFlow
echo "🚀 Démarrage de RegisFlow..."

# Attendre que la base de données soit prête
echo "📡 Attente de la base de données..."
echo "🔍 Test de connexion à postgres:5432..."

# Attendre jusqu'à 120 secondes pour PostgreSQL
RETRIES=24
while [ $RETRIES -gt 0 ]; do
  if pg_isready -h postgres -p 5432 -U regisflow; then
    echo "✅ PostgreSQL est prêt!"
    break
  fi
  echo "⏳ Base de données non prête, tentative $((25-RETRIES))/24, attente de 5 secondes..."
  sleep 5
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Timeout: Impossible de se connecter à PostgreSQL après 2 minutes"
  echo "🔍 Diagnostic:"
  echo "   - Vérifiez que le service postgres démarre correctement"
  echo "   - Vérifiez les logs: docker-compose logs postgres"
  exit 1
fi

echo "✅ Base de données prête!"

# Exécuter les migrations de base de données
echo "🔄 Exécution des migrations..."
npx drizzle-kit push

# Créer le répertoire des sauvegardes s'il n'existe pas
mkdir -p /app/backups

# Démarrer l'application
echo "🎯 Démarrage de l'application RegisFlow..."
exec "$@"