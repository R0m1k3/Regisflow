#!/bin/bash

# Script de debug pour Docker RegisFlow
echo "🔍 Debug Docker RegisFlow"

echo "1. État des containers:"
docker-compose ps

echo ""
echo "2. Logs PostgreSQL (dernières 50 lignes):"
docker-compose logs --tail=50 postgres

echo ""
echo "3. Logs Application (dernières 50 lignes):"
docker-compose logs --tail=50 regisflow

echo ""
echo "4. Test de connectivité réseau:"
echo "   - Test ping postgres depuis regisflow:"
docker-compose exec regisflow ping -c 3 postgres 2>/dev/null || echo "❌ Ping échoué"

echo ""
echo "5. Variables d'environnement dans l'application:"
docker-compose exec regisflow env | grep -E "(DATABASE_URL|POSTGRES|NODE_ENV)"

echo ""
echo "6. Test manuel de connexion PostgreSQL:"
docker-compose exec postgres pg_isready -U regisflow -d regisflow

echo ""
echo "7. Processus dans le container PostgreSQL:"
docker-compose exec postgres ps aux

echo ""
echo "8. Test de port PostgreSQL depuis l'hôte:"
timeout 5 bash -c "</dev/tcp/localhost/5433" && echo "✅ Port 5433 accessible" || echo "❌ Port 5433 inaccessible"

echo ""
echo "🏁 Debug terminé"