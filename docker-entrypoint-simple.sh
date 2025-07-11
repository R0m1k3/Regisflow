#!/bin/sh
set -e

# Script d'entrée simplifié pour RegisFlow
echo "🚀 Démarrage de RegisFlow (mode simplifié)..."

# Attendre que PostgreSQL soit prêt
echo "📡 Attente de la base de données..."
RETRIES=24
while [ $RETRIES -gt 0 ]; do
  if pg_isready -h regisflow-db -p 5432 -U regisflow >/dev/null 2>&1; then
    echo "✅ PostgreSQL prêt!"
    break
  fi
  echo "⏳ Attente... ($((25-RETRIES))/24)"
  sleep 5
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Timeout: Base de données non accessible"
  exit 1
fi

# Créer les répertoires nécessaires
mkdir -p /app/backups /app/logs

# Créer les tables de la base de données
echo "📦 Création des tables de la base de données..."

# Méthode 1: Utiliser Drizzle Kit (recommandé)
if npx drizzle-kit push --config=./drizzle.config.ts; then
  echo "✅ Tables créées avec succès via Drizzle"
else
  echo "⚠️  Drizzle Kit failed, essai avec init.sql..."
  
  # Méthode 2: Fallback avec init.sql si Drizzle échoue
  if [ -f "/app/init.sql" ]; then
    export PGPASSWORD="$POSTGRES_PASSWORD"
    if psql -h regisflow-db -p 5432 -U regisflow -d regisflow -f /app/init.sql; then
      echo "✅ Tables créées avec succès via init.sql"
    else
      echo "❌ Erreur lors de la création des tables"
      exit 1
    fi
  else
    echo "❌ Aucune méthode d'initialisation disponible"
    exit 1
  fi
fi

echo "✅ Base de données configurée"

# Démarrer l'application avec le script de polyfill Node.js 18
echo "🎯 Démarrage de RegisFlow..."
export NODE_ENV=production
export PORT=5000
cd /app
exec node server/prod-start.js