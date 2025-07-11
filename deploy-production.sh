#!/bin/bash

# Script de déploiement automatique RegisFlow Production
# Usage: ./deploy-production.sh

set -e

echo "🚀 Déploiement RegisFlow en production"
echo "======================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Créer le répertoire de déploiement
DEPLOY_DIR="/opt/regisflow"
log_info "Création du répertoire de déploiement : $DEPLOY_DIR"

if [ ! -d "$DEPLOY_DIR" ]; then
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown $USER:$USER "$DEPLOY_DIR"
    log_success "Répertoire créé"
else
    log_info "Répertoire existant"
fi

cd "$DEPLOY_DIR"

# Vérifier la configuration .env
if [ ! -f ".env" ]; then
    log_warning "Fichier .env manquant"
    
    if [ -f ".env.production" ]; then
        log_info "Copie du template .env.production vers .env"
        cp .env.production .env
    else
        log_info "Création d'un fichier .env de base"
        cat > .env << EOF
# Configuration RegisFlow Production
POSTGRES_PASSWORD=RegisFlow2024!PostgreSQL_$(date +%s)
SESSION_SECRET=RegisFlow2024SessionSecret_$(openssl rand -hex 32)
NODE_ENV=production
PORT=5000
TZ=Europe/Paris
SECURE_COOKIES=true
DATA_RETENTION_MONTHS=19
BACKUP_RETENTION_DAYS=90
MAX_BACKUP_COUNT=20
EOF
    fi
    
    log_warning "IMPORTANT: Éditez le fichier .env avec vos propres mots de passe !"
    log_warning "Fichier: $DEPLOY_DIR/.env"
    
    read -p "Appuyez sur Entrée après avoir modifié le fichier .env..."
fi

# Vérifier les fichiers Docker requis
REQUIRED_FILES=("docker-compose.yml" "Dockerfile")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "Fichier manquant: $file"
        log_info "Assurez-vous que tous les fichiers du projet sont présents dans $DEPLOY_DIR"
        exit 1
    fi
done

# Arrêter les anciens conteneurs si ils existent
log_info "Arrêt des anciens conteneurs..."
docker-compose down --remove-orphans 2>/dev/null || true

# Construire et démarrer les services
log_info "Construction et démarrage des services..."
docker-compose up -d --build

# Attendre que les services soient prêts
log_info "Attente du démarrage des services..."
sleep 30

# Vérifier la santé des services
log_info "Vérification de la santé des services..."

# Vérifier PostgreSQL
if docker-compose exec -T regisflow-db pg_isready -U regisflow >/dev/null 2>&1; then
    log_success "PostgreSQL est opérationnel"
else
    log_error "PostgreSQL n'est pas accessible"
    docker-compose logs regisflow-db
    exit 1
fi

# Vérifier l'application
sleep 10
if curl -s -f http://localhost:5000/health >/dev/null 2>&1; then
    log_success "Application RegisFlow est opérationnelle"
else
    log_error "L'application n'est pas accessible"
    docker-compose logs regisflow
    exit 1
fi

# Afficher les informations de connexion
echo ""
log_success "🎉 Déploiement terminé avec succès !"
echo "======================================="
log_info "URL de l'application: http://localhost:5000"
log_info "Compte administrateur par défaut:"
log_info "  - Utilisateur: admin"
log_info "  - Mot de passe: admin123"
log_warning "CHANGEZ le mot de passe administrateur après la première connexion !"
echo ""
log_info "Base de données PostgreSQL accessible sur le port 5433"
echo ""

# Afficher les commandes utiles
echo "Commandes utiles:"
echo "=================="
echo "📋 Voir les logs:          docker-compose logs -f"
echo "📊 État des services:      docker-compose ps"
echo "🔄 Redémarrer:             docker-compose restart"
echo "🛑 Arrêter:                docker-compose down"
echo "📈 Statistiques:           docker stats"
echo ""

log_info "Pour configurer un reverse proxy, consultez PRODUCTION.md"
log_success "Déploiement terminé !"