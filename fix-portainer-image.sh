#!/bin/bash

# Script pour créer l'image exacte que Portainer attend
echo "🔧 Création de l'image regisflow-regisflow:latest pour Portainer"

# Construire l'image avec le nom exact que Portainer cherche
docker build -t regisflow-regisflow:latest .

if [ $? -eq 0 ]; then
    echo "✅ Image regisflow-regisflow:latest créée avec succès"
    
    # Vérifier que l'image existe
    echo "📋 Vérification de l'image:"
    docker images | grep regisflow-regisflow
    
    echo ""
    echo "🐳 L'image est maintenant disponible pour Portainer"
    echo "💡 Vous pouvez maintenant redéployer votre stack dans Portainer"
else
    echo "❌ Échec de la création de l'image"
    exit 1
fi