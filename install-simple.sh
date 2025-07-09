#!/bin/bash

# Installation Simple RegisFlow - Aucune configuration requise
# Utilisation: ./install-simple.sh

set -e

echo "🚀 Installation Simple RegisFlow"
echo "================================"
echo "ℹ️  Installation automatique avec configuration par défaut"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "💡 Installez Docker avec: sudo apt install docker.io docker-compose"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    echo "💡 Installez Docker Compose avec: sudo apt install docker-compose"
    exit 1
fi

# Créer le fichier .env automatiquement
echo "📝 Configuration automatique..."
cp .env.example .env
echo "✅ Fichier .env créé avec configuration par défaut"

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p data/{postgres,backups,logs,postgres-logs}
chmod 755 data data/*
echo "✅ Répertoires créés"

# Arrêter les services existants
echo "🛑 Nettoyage des services existants..."
docker-compose down 2>/dev/null || true

# Construire les images
echo "🔨 Construction des images..."
docker-compose build

# Démarrer les services avec configuration simple
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre le démarrage
echo "⏳ Attente du démarrage (60 secondes)..."
sleep 60

# Vérifier le statut
echo "🔍 Vérification du statut..."
docker-compose ps

# Test de connectivité
echo "🔗 Test de l'application..."
if curl -f http://localhost:5000 &>/dev/null; then
    echo "✅ Application accessible !"
else
    echo "⚠️  Application en cours de démarrage..."
fi

echo ""
echo "🎉 INSTALLATION TERMINÉE !"
echo "========================="
echo "📱 Application RegisFlow : http://localhost:5000"
echo "🗄️  PostgreSQL : localhost:5433"
echo "👤 Compte par défaut : admin / admin123"
echo ""
echo "📋 Commandes utiles :"
echo "  - Logs : docker-compose logs -f"
echo "  - Arrêt : docker-compose down"
echo "  - Statut : docker-compose ps"
echo ""
echo "⚠️  Pour la production, changez les mots de passe dans .env"