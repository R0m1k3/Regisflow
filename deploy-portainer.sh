#!/bin/bash

# Script de déploiement pour Portainer RegisFlow
# Ce script prépare et déploie RegisFlow via Portainer

echo "🚀 Déploiement RegisFlow pour Portainer"
echo "======================================"

# Étape 1: Construire l'image Docker
echo "🔧 Étape 1: Construction de l'image Docker..."
docker build -t regisflow:latest .

if [ $? -eq 0 ]; then
    echo "✅ Image construite avec succès"
else
    echo "❌ Échec de la construction de l'image"
    exit 1
fi

# Étape 2: Vérifier que l'image existe
echo "🔍 Étape 2: Vérification de l'image..."
docker images | grep regisflow

# Étape 3: Arrêter les conteneurs existants si ils existent
echo "🛑 Étape 3: Nettoyage des conteneurs existants..."
docker stop regisflow-app regisflow-db 2>/dev/null || true
docker rm regisflow-app regisflow-db 2>/dev/null || true

# Étape 4: Informations pour Portainer
echo ""
echo "🐳 Instructions pour Portainer:"
echo "==============================="
echo "1. Dans Portainer, allez dans 'Stacks'"
echo "2. Cliquez sur 'Add stack'"
echo "3. Donnez un nom: 'regisflow'"
echo "4. Copiez le contenu du fichier 'portainer-stack.yml'"
echo "5. Cliquez sur 'Deploy the stack'"
echo ""
echo "📝 Nom de l'image à utiliser: regisflow:latest"
echo "🔗 URL d'accès: http://votre-serveur:5000"
echo "🔐 Connexion par défaut: admin/admin123"
echo ""
echo "📋 Ports exposés:"
echo "   - Application: 5000"
echo "   - PostgreSQL: 5433"
echo ""
echo "✅ Prêt pour le déploiement Portainer!"