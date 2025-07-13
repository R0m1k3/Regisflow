#!/bin/sh
set -e

echo "🚀 RegisFlow Production Startup"
echo "Database URL: ${DATABASE_URL:0:30}..."

# Attendre que PostgreSQL soit disponible
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h $(echo $DATABASE_URL | cut -d'/' -f3 | cut -d':' -f1) -p $(echo $DATABASE_URL | cut -d':' -f4 | cut -d'/' -f1) > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Migrer la base de données
echo "🔄 Running database migrations..."
npm run db:push

echo "🎯 Starting RegisFlow application..."
exec "$@"