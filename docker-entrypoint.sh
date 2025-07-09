#!/bin/sh
set -e

# Script d'entrée pour le container RegisFlow
echo "🚀 Démarrage de RegisFlow..."

# Attendre que la base de données Docker soit prête
echo "📡 Attente de la base de données regisflow-db..."
echo "🔍 Test de connexion à regisflow-db:5432..."

# Attendre jusqu'à 120 secondes pour PostgreSQL Docker
RETRIES=24
while [ $RETRIES -gt 0 ]; do
  if pg_isready -h regisflow-db -p 5432 -U regisflow; then
    echo "✅ PostgreSQL regisflow-db est prêt!"
    break
  fi
  echo "⏳ Base de données non prête, tentative $((25-RETRIES))/24, attente de 5 secondes..."
  sleep 5
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Timeout: Impossible de se connecter à regisflow-db après 2 minutes"
  echo "🔍 Diagnostic:"
  echo "   - Vérifiez que le service regisflow-db démarre correctement"
  echo "   - Vérifiez les logs: docker-compose logs regisflow-db"
  exit 1
fi

echo "✅ Base de données prête!"

# Exécuter les migrations de base de données
echo "🔄 Exécution des migrations..."
npx drizzle-kit push

# Créer le répertoire des sauvegardes s'il n'existe pas
mkdir -p /app/backups

# Construire l'application pour la production
echo "🔨 Construction de l'application..."
npm run build

# Démarrer l'application en production
echo "🎯 Démarrage de l'application RegisFlow..."
exec npm run start