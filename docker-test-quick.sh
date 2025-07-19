#!/bin/bash
set -e

echo "🐳 RegisFlow Docker Quick Test"
echo "=============================="

# Nettoyer les anciens containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v 2>/dev/null || true
docker system prune -f >/dev/null 2>&1 || true

# Test de build avec l'approche simplifiée (skip migrations)
echo "🔨 Building fresh Docker image (simple approach - skip migrations)..."
if docker-compose build --no-cache regisflow; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Créer .env.production si nécessaire
if [[ ! -f ".env.production" ]]; then
    echo "📝 Creating .env.production from example..."
    cp .env.production.example .env.production
fi

# Test de démarrage
echo "🚀 Starting containers..."
if docker-compose up -d; then
    echo "✅ Containers started"
    
    # Attendre l'application
    echo "⏳ Waiting for application..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/health >/dev/null 2>&1; then
            echo "✅ Application is responding!"
            echo "🏥 Health: $(curl -s http://localhost:5000/health | grep -o '"status":"[^"]*"' || echo 'OK')"
            break
        fi
        echo "   Attempt $i/30..."
        sleep 2
    done
    
    if [ $i -eq 30 ]; then
        echo "❌ Application timeout"
        echo "📋 Recent logs:"
        docker-compose logs --tail=10 regisflow
        exit 1
    fi
    
else
    echo "❌ Container startup failed"
    exit 1
fi

echo ""
echo "🎉 SUCCESS! RegisFlow is running"
echo "================================"
echo "Access: http://localhost:5000"
echo "Admin: admin / admin123"
echo ""
echo "To stop: docker-compose down"
echo "To see logs: docker-compose logs -f"