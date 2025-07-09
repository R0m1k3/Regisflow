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

# Initialiser la base de données (les tables seront créées automatiquement par l'application)
echo "✅ Base de données configurée"

# Démarrer l'application
echo "🎯 Démarrage de RegisFlow..."
exec node dist/index.js