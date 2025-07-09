#!/bin/bash

# Script de debug pour Docker RegisFlow (Base de données EXTERNE)
echo "🔍 Debug Docker RegisFlow - Base PostgreSQL externe"

echo "1. État des containers:"
docker-compose ps

echo ""
echo "2. Logs Application (dernières 50 lignes):"
docker-compose logs --tail=50 regisflow

echo ""
echo "3. Variables d'environnement dans l'application:"
docker-compose exec regisflow env | grep -E "(DATABASE_URL|NODE_ENV|TZ)"

echo ""
echo "4. Test de connexion à la base externe:"
echo "   - Extraction des paramètres de connexion:"
docker-compose exec regisflow sh -c 'echo "Host: $(echo $DATABASE_URL | sed -n \"s|.*@\([^:]*\):.*|\1|p\")"'
docker-compose exec regisflow sh -c 'echo "Port: $(echo $DATABASE_URL | sed -n \"s|.*:\([0-9]*\)/.*|\1|p\")"'
docker-compose exec regisflow sh -c 'echo "User: $(echo $DATABASE_URL | sed -n \"s|.*://\([^:]*\):.*|\1|p\")"'

echo ""
echo "5. Test de connectivité vers la base externe:"
docker-compose exec regisflow sh -c 'pg_isready -h $(echo $DATABASE_URL | sed -n "s|.*@\([^:]*\):.*|\1|p") -p $(echo $DATABASE_URL | sed -n "s|.*:\([0-9]*\)/.*|\1|p") -U regisflow'

echo ""
echo "6. Test de résolution DNS:"
docker-compose exec regisflow sh -c 'nslookup $(echo $DATABASE_URL | sed -n "s|.*@\([^:]*\):.*|\1|p") || echo "❌ DNS échoué"'

echo ""
echo "7. Test de port depuis le container:"
docker-compose exec regisflow sh -c 'nc -zv $(echo $DATABASE_URL | sed -n "s|.*@\([^:]*\):.*|\1|p") $(echo $DATABASE_URL | sed -n "s|.*:\([0-9]*\)/.*|\1|p") 2>&1 || echo "❌ Port inaccessible"'

echo ""
echo "🏁 Debug terminé - Base PostgreSQL externe"