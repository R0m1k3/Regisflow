#!/bin/sh
set -e

echo "🚀 RegisFlow Production Startup"
echo "Node.js version: $(node --version)"
echo "Current directory: $(pwd)"
echo "Available files:"
ls -la

# Attendre que PostgreSQL soit disponible
echo "⏳ Waiting for PostgreSQL..."
DB_HOST="regisflow-db"
DB_PORT="5432"
DB_USER="regisflow"

echo "Testing connection to: $DB_HOST:$DB_PORT as $DB_USER"

# Attendre avec timeout
RETRIES=20
while [ $RETRIES -gt 0 ]; do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  echo "PostgreSQL is unavailable - sleeping ($((21-RETRIES))/20)"
  sleep 3
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Timeout: PostgreSQL connection failed"
  exit 1
fi

# Migrer la base de données une seule fois
echo "🔄 Running database migrations..."
npm run db:push

echo "🎯 Starting RegisFlow application..."
echo "Command to execute: $@"

# Démarrer l'application avec debugging
exec "$@"