#!/bin/sh
set -e

echo "🚀 RegisFlow Production Startup"
echo "Database URL: ${DATABASE_URL:0:30}..."

# Attendre que PostgreSQL soit disponible
echo "⏳ Waiting for PostgreSQL..."
echo "Database URL: $DATABASE_URL"

# Extraire les paramètres de connexion plus simplement
DB_HOST="regisflow-db"
DB_PORT="5432"
DB_USER="regisflow"

echo "Connecting to: $DB_HOST:$DB_PORT as $DB_USER"

# Attendre avec timeout
RETRIES=30
while [ $RETRIES -gt 0 ]; do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  echo "PostgreSQL is unavailable - sleeping ($((31-RETRIES))/30)"
  sleep 3
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Timeout: PostgreSQL connection failed"
  exit 1
fi

echo "✅ PostgreSQL is ready!"

# Migrer la base de données
echo "🔄 Running database migrations..."
npm run db:push

echo "🎯 Starting RegisFlow application..."
exec "$@"