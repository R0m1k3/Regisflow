#!/bin/bash

# Script de déploiement simplifié pour Portainer
# Gère tout automatiquement sans configuration manuelle

echo "🚀 Déploiement RegisFlow pour Portainer (Automatique)"
echo "===================================================="

# Créer un répertoire de déploiement temporaire
DEPLOY_DIR="/tmp/regisflow-deploy"
CURRENT_DIR=$(pwd)

echo "📁 Préparation du déploiement..."

# Nettoyer le répertoire de déploiement s'il existe
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copier tous les fichiers nécessaires
echo "📋 Copie des fichiers..."
cp -r . "$DEPLOY_DIR/"
cd "$DEPLOY_DIR"

# Utiliser le Docker Compose spécifique à Portainer
mv docker-compose-portainer.yml docker-compose.yml

echo "🔧 Construction et démarrage..."

# Arrêter les conteneurs existants
docker-compose down 2>/dev/null || true

# Construire et démarrer
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Déploiement réussi!"
    echo ""
    echo "📊 État des conteneurs:"
    docker-compose ps
    echo ""
    echo "🔗 Application accessible sur: http://localhost:5000"
    echo "🔐 Connexion par défaut: admin/admin123"
    echo "🗄️  PostgreSQL accessible sur le port: 5433"
    echo ""
    echo "📋 Commandes utiles:"
    echo "  - Voir les logs: docker-compose logs -f"
    echo "  - Arrêter: docker-compose down"
    echo "  - Redémarrer: docker-compose restart"
    echo ""
    echo "📁 Fichiers de déploiement dans: $DEPLOY_DIR"
else
    echo "❌ Échec du déploiement"
    echo "📋 Vérifiez les logs avec: docker-compose logs"
    exit 1
fi

# Retourner au répertoire original
cd "$CURRENT_DIR"