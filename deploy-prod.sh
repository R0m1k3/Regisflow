#!/bin/bash

# Script de déploiement PRODUCTION RegisFlow
# Utilisation: ./deploy-prod.sh

set -e

echo "🚀 Déploiement PRODUCTION RegisFlow"
echo "===================================="

# Vérifications préalables
echo "🔍 Vérifications préalables..."

# Vérifier que nous sommes en mode production
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Variable NODE_ENV non définie sur 'production'"
    read -p "Continuer quand même ? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Vérifier Docker et Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Créer les répertoires de données
echo "📁 Création des répertoires de données..."
mkdir -p data/{postgres,backups,logs,postgres-logs}
chmod 755 data data/*

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "✅ Fichier .env créé avec configuration par défaut"
    
    echo ""
    echo "ℹ️  CONFIGURATION AUTOMATIQUE :"
    echo "   - Mots de passe pré-configurés pour installation simple"
    echo "   - Pour la production, modifiez POSTGRES_PASSWORD et SESSION_SECRET"
    echo ""
fi

# Vérifier les variables critiques
echo "🔒 Vérification de la configuration..."
source .env

if [ "$POSTGRES_PASSWORD" = "RegisFlow2024!PostgreSQL" ]; then
    echo "⚠️  Utilisation des mots de passe par défaut (OK pour test, changez pour production)"
else
    echo "✅ Mots de passe personnalisés détectés"
fi

echo "✅ Configuration validée"

# Arrêter les services existants
echo "🛑 Arrêt des services existants..."
docker-compose down 2>/dev/null || true

# Construire les images
echo "🔨 Construction des images de production..."
docker-compose build --no-cache

# Vérifier l'espace disque
echo "💾 Vérification de l'espace disque..."
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | cut -d'%' -f1)
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  Attention: Espace disque faible ($DISK_USAGE%)"
    read -p "Continuer ? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Démarrer les services avec configuration production
echo "🚀 Démarrage des services de production..."
docker-compose up -d

# Attendre le démarrage
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier la santé des services
echo "🏥 Vérification de la santé des services..."
for i in {1..30}; do
    if docker-compose ps | grep -q "healthy"; then
        echo "✅ Services démarrés avec succès"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout: Les services ne démarrent pas correctement"
        echo "📋 Logs des services :"
        docker-compose logs --tail=20
        exit 1
    fi
    sleep 5
done

# Test de connectivité
echo "🔗 Test de connectivité..."
if curl -f http://localhost:5000/health &>/dev/null; then
    echo "✅ Application accessible sur http://localhost:5000"
else
    echo "❌ Application non accessible"
    docker-compose logs regisflow --tail=20
    exit 1
fi

# Afficher le statut final
echo ""
echo "🎉 DÉPLOIEMENT PRODUCTION RÉUSSI !"
echo "=================================="
echo "📱 Application RegisFlow : http://localhost:5000"
echo "🗄️  PostgreSQL : localhost:5433"
echo "📊 Statut des services :"
docker-compose ps

echo ""
echo "📋 Commandes utiles :"
echo "  - Logs : docker-compose logs -f"
echo "  - Statut : docker-compose ps"
echo "  - Arrêt : docker-compose down"
echo "  - Sauvegarde : docker-compose exec regisflow-db pg_dump -U regisflow regisflow > backup.sql"
echo ""
echo "⚠️  N'oubliez pas de configurer HTTPS avec un reverse proxy pour la production !"