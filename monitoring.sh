#!/bin/bash

# Script de monitoring pour RegisFlow Production
# Usage: ./monitoring.sh [check|logs|backup|stats]

COMMAND=${1:-check}

case $COMMAND in
    "check")
        echo "🔍 Vérification de l'état des services RegisFlow"
        echo "=============================================="
        
        echo "📊 Statut des containers :"
        docker-compose ps
        
        echo ""
        echo "🏥 Health checks :"
        
        # Vérifier RegisFlow
        if curl -f -s http://localhost:5000/health > /dev/null; then
            echo "✅ RegisFlow : OK"
        else
            echo "❌ RegisFlow : ERREUR"
        fi
        
        # Vérifier PostgreSQL
        if docker-compose exec -T regisflow-db pg_isready -U regisflow -q; then
            echo "✅ PostgreSQL : OK"
        else
            echo "❌ PostgreSQL : ERREUR"
        fi
        
        echo ""
        echo "💾 Utilisation des ressources :"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
        
        echo ""
        echo "💿 Espace disque :"
        df -h | grep -E "(Filesystem|/dev/)"
        
        echo ""
        echo "📁 Taille des volumes :"
        du -sh data/* 2>/dev/null || echo "Répertoire data non trouvé"
        ;;
        
    "logs")
        echo "📋 Logs des services RegisFlow"
        echo "=============================="
        
        echo "📱 Logs RegisFlow (20 dernières lignes) :"
        docker-compose logs --tail=20 regisflow
        
        echo ""
        echo "🗄️  Logs PostgreSQL (20 dernières lignes) :"
        docker-compose logs --tail=20 regisflow-db
        ;;
        
    "backup")
        echo "💾 Création d'une sauvegarde manuelle"
        echo "===================================="
        
        BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
        
        echo "Création de la sauvegarde : $BACKUP_FILE"
        docker-compose exec -T regisflow-db pg_dump -U regisflow regisflow > "data/backups/$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Sauvegarde créée avec succès : data/backups/$BACKUP_FILE"
            echo "📊 Taille : $(ls -lh data/backups/$BACKUP_FILE | awk '{print $5}')"
        else
            echo "❌ Erreur lors de la création de la sauvegarde"
        fi
        ;;
        
    "stats")
        echo "📊 Statistiques détaillées RegisFlow"
        echo "===================================="
        
        echo "🔢 Statistiques base de données :"
        docker-compose exec -T regisflow-db psql -U regisflow -d regisflow -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_stat_get_tuples_returned(c.oid) as tuple_read,
            pg_stat_get_tuples_fetched(c.oid) as tuple_fetch,
            pg_stat_get_tuples_inserted(c.oid) as tuple_insert,
            pg_stat_get_tuples_updated(c.oid) as tuple_update,
            pg_stat_get_tuples_deleted(c.oid) as tuple_delete
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        "
        
        echo ""
        echo "📁 Utilisation des volumes Docker :"
        docker system df
        
        echo ""
        echo "🔄 Uptime des services :"
        docker-compose ps --format "table {{.Name}}\t{{.Status}}"
        
        echo ""
        echo "📈 Métriques système :"
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
        echo "RAM: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
        echo "Disk: $(df / | awk 'NR==2{print $5}')"
        ;;
        
    *)
        echo "Usage: $0 [check|logs|backup|stats]"
        echo ""
        echo "Commandes disponibles :"
        echo "  check  - Vérifier l'état des services"
        echo "  logs   - Afficher les logs"
        echo "  backup - Créer une sauvegarde manuelle"
        echo "  stats  - Afficher les statistiques détaillées"
        ;;
esac