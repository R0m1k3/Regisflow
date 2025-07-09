#!/bin/bash

# Script de déploiement simplifié pour RegisFlow
echo "🚀 Déploiement de RegisFlow avec Docker"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installez Docker d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Installez Docker Compose d'abord."
    exit 1
fi

echo "✅ Docker et Docker Compose détectés"

# Arrêter les services existants
echo "🛑 Arrêt des services existants..."
docker-compose down -v 2>/dev/null || true

# Nettoyer les anciens containers et images
echo "🧹 Nettoyage des anciens containers..."
docker system prune -f

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Configurez l'IP de votre serveur PostgreSQL :"
    echo "   - Remplacez 192.168.1.100 par l'IP de votre serveur PostgreSQL"
    echo "   - Utilisateur/mot de passe préconfigurés : regisflow / RegisFlow2024!"
    echo "   - Exécutez setup-postgres.sql sur votre serveur PostgreSQL"
    echo "   - Changez SESSION_SECRET pour la sécurité"
    read -p "Appuyez sur Entrée pour continuer..."
fi

# Construire et démarrer les services
echo "🏗️  Construction et démarrage des services..."
docker-compose up -d --build

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier le statut des services
echo "📊 Vérification du statut des services..."
docker-compose ps

# Afficher les logs des dernières minutes
echo "📋 Logs récents:"
docker-compose logs --tail=50

echo ""
echo "🎉 Déploiement terminé!"
echo "📱 Application accessible sur: http://localhost:5000"
echo "🗄️  Base de données accessible sur: localhost:5433"
echo "👤 Compte par défaut: admin / admin123"
echo ""
echo "📝 Pour voir les logs en continu:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Pour arrêter les services:"
echo "   docker-compose down"