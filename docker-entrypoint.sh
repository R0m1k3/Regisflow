#!/bin/sh
set -e

# Script d'entrée pour le container RegisFlow
echo "🚀 Démarrage de RegisFlow..."

# Attendre que la base de données externe soit prête
echo "📡 Attente de la base de données externe..."

# Extraire l'hôte et le port depuis DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')

if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
  echo "❌ Erreur: DATABASE_URL mal formatée"
  echo "Format attendu: postgresql://user:password@host:port/database"
  echo "DATABASE_URL actuelle: $DATABASE_URL"
  exit 1
fi

echo "🔍 Test de connexion à $DB_HOST:$DB_PORT..."

# Attendre jusqu'à 120 secondes pour PostgreSQL externe
RETRIES=24
while [ $RETRIES -gt 0 ]; do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; then
    echo "✅ PostgreSQL externe est prêt!"
    break
  fi
  echo "⏳ Base de données externe non prête, tentative $((25-RETRIES))/24, attente de 5 secondes..."
  sleep 5
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Timeout: Impossible de se connecter à PostgreSQL externe après 2 minutes"
  echo "🔍 Diagnostic:"
  echo "   - Host: $DB_HOST"
  echo "   - Port: $DB_PORT"
  echo "   - User: $DB_USER"
  echo "   - Vérifiez que PostgreSQL est accessible depuis Docker"
  echo "   - Vérifiez le firewall et les permissions réseau"
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