#!/bin/bash
set -e

echo "🚀 RegisFlow Docker entrypoint started (Production v2025)"

# Vérifier les variables d'environnement essentielles
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  WARNING: SESSION_SECRET not set, using default (not recommended for production)"
fi

echo "📊 Environment configured - NODE_ENV: $NODE_ENV"
echo "🗄️  Database URL configured"
echo "🌍 Timezone: $TZ"

# Patch pour Node.js compatibility (import.meta.dirname)
if [ -f "dist/index.js" ] && ! grep -q "__dirname" dist/index.js; then
    echo "🔧 Applying Node.js compatibility patch..."
    sed -i 's|import\.meta\.dirname|process.cwd()|g' dist/index.js
    echo "✅ Compatibility patch applied"
fi

# Extraction des informations de connexion pour pg_isready
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:/]*\).*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')

echo "🔗 Connecting to: $DB_HOST:${DB_PORT:-5432}"

# Attendre que la base de données soit prête avec retry amélioré
echo "⏳ Waiting for database to be ready..."
timeout=90
while ! pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -q && [ $timeout -gt 0 ]; do
    echo "Database not ready, waiting... ($timeout seconds left)"
    sleep 3
    timeout=$((timeout-3))
done

if [ $timeout -le 0 ]; then
    echo "❌ Database connection timeout after 90 seconds"
    echo "🔍 Debug info:"
    echo "   HOST: $DB_HOST"
    echo "   PORT: ${DB_PORT:-5432}"  
    echo "   USER: $DB_USER"
    exit 1
fi

echo "✅ Database is ready and accessible"

# Créer les répertoires nécessaires
mkdir -p /app/logs /app/backups
echo "📁 Created application directories"

# Exécuter les migrations de base de données
echo "🔄 Running database migrations..."
if npm run db:push; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

# Vérification des permissions et de l'espace disque
echo "🔍 System checks:"
echo "   Disk space: $(df -h /app | tail -1 | awk '{print $4}') available"
echo "   Memory: $(free -h | grep Mem | awk '{print $7}') available"
echo "   User: $(whoami)"

# Démarrer l'application
echo "🌟 Starting RegisFlow application on port $PORT..."
echo "🏥 Health check available at: http://localhost:$PORT/health"
exec npm start