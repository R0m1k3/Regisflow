#!/bin/bash

# Script d'initialisation de la base de données RegisFlow
# Usage: ./init-db.sh [DATABASE_URL]

set -e

# Configuration par défaut
DEFAULT_DB_HOST="localhost"
DEFAULT_DB_PORT="5433"
DEFAULT_DB_NAME="regisflow"
DEFAULT_DB_USER="regisflow"
DEFAULT_DB_PASSWORD="RegisFlow2024!PostgreSQL"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Fonction pour extraire les informations de DATABASE_URL
parse_database_url() {
    local url="$1"
    
    # Extraire les composants de l'URL PostgreSQL
    if [[ $url =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    else
        log_error "Format DATABASE_URL invalide. Utilisez: postgresql://user:password@host:port/database"
        exit 1
    fi
}

# Déterminer la configuration de la base de données
if [ -n "$1" ]; then
    log_info "Utilisation de DATABASE_URL fournie: $1"
    parse_database_url "$1"
elif [ -n "$DATABASE_URL" ]; then
    log_info "Utilisation de DATABASE_URL depuis l'environnement"
    parse_database_url "$DATABASE_URL"
else
    log_info "Utilisation de la configuration par défaut"
    DB_HOST="$DEFAULT_DB_HOST"
    DB_PORT="$DEFAULT_DB_PORT"
    DB_NAME="$DEFAULT_DB_NAME"
    DB_USER="$DEFAULT_DB_USER"
    DB_PASSWORD="$DEFAULT_DB_PASSWORD"
fi

log_info "Configuration de la base de données:"
log_info "  Host: $DB_HOST"
log_info "  Port: $DB_PORT"
log_info "  Database: $DB_NAME"
log_info "  User: $DB_USER"

# Vérifier que psql est installé
if ! command -v psql &> /dev/null; then
    log_error "psql n'est pas installé. Installez PostgreSQL client."
    exit 1
fi

# Vérifier la connexion à PostgreSQL
log_info "Test de connexion à PostgreSQL..."
export PGPASSWORD="$DB_PASSWORD"

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
    log_error "Impossible de se connecter à PostgreSQL"
    log_info "Vérifiez que PostgreSQL est démarré et accessible"
    log_info "Commande de test: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    exit 1
fi

log_success "Connexion PostgreSQL réussie"

# Exécuter le script d'initialisation
log_info "Exécution du script d'initialisation..."

if [ -f "init.sql" ]; then
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f init.sql; then
        log_success "Script d'initialisation exécuté avec succès"
    else
        log_error "Erreur lors de l'exécution du script d'initialisation"
        exit 1
    fi
else
    log_error "Fichier init.sql non trouvé"
    exit 1
fi

# Vérifier que les tables ont été créées
log_info "Vérification des tables créées..."
TABLES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public';" | tr -d ' ' | grep -v '^$')

if echo "$TABLES" | grep -q "users\|stores\|sales\|sessions"; then
    log_success "Tables principales créées:"
    echo "$TABLES" | while read -r table; do
        if [ -n "$table" ]; then
            log_info "  - $table"
        fi
    done
else
    log_error "Les tables principales n'ont pas été créées correctement"
    exit 1
fi

# Vérifier l'utilisateur admin
log_info "Vérification de l'utilisateur administrateur..."
ADMIN_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE username='admin';" | tr -d ' ')

if [ "$ADMIN_COUNT" = "1" ]; then
    log_success "Utilisateur admin créé avec succès"
else
    log_warning "Problème avec la création de l'utilisateur admin"
fi

# Afficher le résumé
echo ""
log_success "🎉 Initialisation de la base de données terminée!"
echo "======================================================"
log_info "Base de données: $DB_NAME sur $DB_HOST:$DB_PORT"
log_info "Utilisateur administrateur:"
log_info "  - Username: admin"
log_info "  - Password: admin123"
log_warning "IMPORTANT: Changez le mot de passe admin après la première connexion!"
echo ""

# Nettoyer les variables d'environnement
unset PGPASSWORD

log_success "Prêt pour le déploiement!"