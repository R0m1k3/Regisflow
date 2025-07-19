#!/bin/bash

echo "🚀 RegisFlow Docker Deployment Test"
echo "==================================="

# Fonction de test des prérequis
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker."
        exit 1
    fi
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    echo "✅ Docker and Docker Compose are available"
}

# Fonction de validation des fichiers
check_files() {
    echo "📁 Checking required files..."
    
    required_files=(
        "Dockerfile"
        "docker-compose.yml" 
        "docker-entrypoint.sh"
        ".env.production.example"
        "package.json"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo "❌ Missing required file: $file"
            exit 1
        fi
    done
    
    echo "✅ All required files are present"
}

# Test de build Docker
test_docker_build() {
    echo "🔨 Testing Docker build..."
    
    if docker-compose build --no-cache regisflow; then
        echo "✅ Docker build successful"
    else
        echo "❌ Docker build failed"
        exit 1
    fi
}

# Test de configuration
test_configuration() {
    echo "⚙️  Testing configuration..."
    
    if [[ ! -f ".env.production" ]]; then
        echo "⚠️  .env.production not found, creating from example..."
        cp .env.production.example .env.production
        echo "📝 Please edit .env.production with your secure credentials!"
    fi
    
    # Vérifier que les variables critiques ne sont pas par défaut
    if grep -q "CHANGEME" .env.production; then
        echo "⚠️  WARNING: Default passwords detected in .env.production"
        echo "   Please change POSTGRES_PASSWORD and SESSION_SECRET"
    fi
    
    echo "✅ Configuration checked"
}

# Test de démarrage rapide
test_startup() {
    echo "🚦 Testing container startup..."
    
    # Nettoyer d'abord
    docker-compose down -v 2>/dev/null
    
    # Démarrer en mode détaché
    if docker-compose up -d; then
        echo "✅ Containers started successfully"
        
        # Attendre que l'application soit prête
        echo "⏳ Waiting for application to be ready..."
        timeout=60
        while ! curl -s http://localhost:5000/health >/dev/null && [ $timeout -gt 0 ]; do
            echo "   Waiting... ($timeout seconds left)"
            sleep 2
            timeout=$((timeout-2))
        done
        
        if [ $timeout -gt 0 ]; then
            echo "✅ Application is responding"
            echo "🏥 Health check: $(curl -s http://localhost:5000/health | grep -o '"status":"[^"]*"')"
        else
            echo "❌ Application startup timeout"
            echo "📋 Container logs:"
            docker-compose logs --tail=20 regisflow
            exit 1
        fi
        
    else
        echo "❌ Container startup failed"
        exit 1
    fi
}

# Test de connexion base de données
test_database() {
    echo "🗄️  Testing database connection..."
    
    if docker exec regisflow-db pg_isready -U regisflow -q; then
        echo "✅ Database is accessible"
        
        # Tester les tables
        tables=$(docker exec regisflow-db psql -U regisflow -t -c "\dt" | wc -l)
        echo "📊 Database has $tables tables"
        
    else
        echo "❌ Database connection failed"
        exit 1
    fi
}

# Fonction de nettoyage
cleanup() {
    echo "🧹 Cleaning up test containers..."
    docker-compose down -v
    echo "✅ Cleanup completed"
}

# Test complet
run_full_test() {
    check_prerequisites
    check_files
    test_configuration
    test_docker_build
    test_startup
    test_database
    
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "===================="
    echo "RegisFlow is ready for production deployment"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env.production with secure credentials"
    echo "2. Run: docker-compose up -d"
    echo "3. Access: http://localhost:5000"
    echo "4. Monitor: docker-compose logs -f"
    echo ""
    
    cleanup
}

# Exécuter le test ou afficher l'aide
case "${1:-test}" in
    "test")
        run_full_test
        ;;
    "build")
        check_prerequisites
        check_files
        test_docker_build
        ;;
    "health")
        curl -s http://localhost:5000/health | python3 -m json.tool || echo "Application not running"
        ;;
    "cleanup")
        cleanup
        ;;
    "help")
        echo "Usage: $0 [test|build|health|cleanup|help]"
        echo "  test     - Run full deployment test (default)"
        echo "  build    - Test Docker build only"
        echo "  health   - Check application health"
        echo "  cleanup  - Clean up test containers"
        echo "  help     - Show this help"
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac