#!/bin/bash

# Script de construction Docker pour RegisFlow
# Ce script construit l'image Docker localement

echo "🔧 Construction de l'image Docker RegisFlow..."

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire l'image avec un nom spécifique
echo "🏗️ Construction de l'image..."
docker build -t regisflow:latest .

# Vérifier que l'image a été construite
echo "📋 Vérification de l'image construite..."
docker images | grep regisflow

echo "✅ Image construite avec succès !"
echo "🐳 Vous pouvez maintenant utiliser 'regisflow:latest' dans Portainer"
echo ""
echo "Pour démarrer l'application :"
echo "  docker-compose up -d"