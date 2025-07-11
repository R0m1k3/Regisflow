# Guide de Mise en Production RegisFlow

## Configuration rapide pour production

### 1. Télécharger et préparer

```bash
# Créer le dossier de production
mkdir /opt/regisflow && cd /opt/regisflow

# Télécharger les fichiers nécessaires
curl -O https://raw.githubusercontent.com/votre-repo/regisflow/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/votre-repo/regisflow/main/Dockerfile
curl -O https://raw.githubusercontent.com/votre-repo/regisflow/main/docker-entrypoint-simple.sh
```

### 2. Configuration environnement

Créer le fichier `.env` :

```env
# === OBLIGATOIRE - À MODIFIER ===
POSTGRES_PASSWORD=VotreMotDePasseSuperSecurise123!
SESSION_SECRET=VotreCleSessionTresLongueEtSecurisee456789ABCDEF

# === APPLICATION ===
NODE_ENV=production
PORT=5000
TZ=Europe/Paris

# === SÉCURITÉ ===
SECURE_COOKIES=true
DATA_RETENTION_MONTHS=19

# === SAUVEGARDES ===
BACKUP_RETENTION_DAYS=90
MAX_BACKUP_COUNT=20
```

### 3. Déploiement immédiat

```bash
# Démarrer l'application
docker-compose up -d --build

# Vérifier le fonctionnement
curl http://localhost:5000/health

# Voir les logs
docker-compose logs -f regisflow
```

### 4. Accès initial

- **URL** : http://votre-serveur:5000
- **Compte admin** : `admin` / `admin123`
- **Base de données** : accessible sur port 5433

### 5. Nginx reverse proxy (recommandé)

Ajouter à votre configuration Nginx :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    client_max_body_size 10M;  # Pour les photos
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 6. Maintenance courante

```bash
# Voir l'état des services
docker-compose ps

# Redémarrer l'application
docker-compose restart regisflow

# Mise à jour
docker-compose down
docker-compose up -d --build --force-recreate

# Sauvegardes manuelles
docker-compose exec regisflow node -e "require('./dist/backup-scheduler.js').createAutomaticBackup()"

# Accès aux données
docker-compose exec regisflow-db psql -U regisflow -d regisflow
```

### 7. Monitoring et logs

```bash
# Logs en temps réel
docker-compose logs -f

# Utilisation des ressources
docker stats regisflow-app regisflow-db

# Espace disque des volumes
docker system df
```

## Fonctionnalités automatiques en production

✅ **Sauvegardes automatiques** : Toutes les 12h (00:00 et 12:00)  
✅ **Purge des données** : Automatique après 19 mois (1er de chaque mois)  
✅ **Health checks** : Surveillance continue des services  
✅ **Gestion des sessions** : Sessions PostgreSQL sécurisées  
✅ **Optimisation mémoire** : Configuration pour serveurs de production  

## Sécurité production

- [ ] Modifier `POSTGRES_PASSWORD` et `SESSION_SECRET`
- [ ] Configurer firewall (ports 80, 443, 22 uniquement)
- [ ] Activer HTTPS avec certificats SSL
- [ ] Sauvegardes régulières vers stockage externe
- [ ] Monitoring des logs d'erreurs
- [ ] Changer le mot de passe admin par défaut

## Support et dépannage

**Problèmes courants :**

1. **Application inaccessible** : Vérifier `docker-compose ps` et les logs
2. **Erreur base de données** : Vérifier que PostgreSQL est démarré
3. **Photos ne se sauvegardent pas** : Vérifier les permissions du volume
4. **Performance lente** : Augmenter les limites mémoire Docker

**Commandes de diagnostic :**

```bash
# État complet du système
docker-compose ps && docker-compose logs --tail=50
docker system df && df -h

# Test complet de l'application
curl -v http://localhost:5000/health
curl -v http://localhost:5000/api/auth/default-credentials-status
```