# Déploiement Docker de RegisFlow

## 1. Préparer le serveur

```bash
# Créer le répertoire de déploiement
mkdir -p /opt/regisflow
cd /opt/regisflow

# Télécharger les fichiers essentiels
wget https://raw.githubusercontent.com/votre-repo/regisflow/main/docker-compose.yml
wget https://raw.githubusercontent.com/votre-repo/regisflow/main/.env.example
cp .env.example .env
```

## 2. Configuration (.env)

Editez le fichier `.env` selon votre environnement :

```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://regisflow:VotreMotDePasseSecurise@regisflow-db:5432/regisflow
POSTGRES_PASSWORD=VotreMotDePasseSecurise

# Application
NODE_ENV=production
PORT=5000
SESSION_SECRET=VotreCleSecreteTresLongueEtSecurisee

# Timezone
TZ=Europe/Paris

# Sauvegardes
BACKUP_RETENTION_DAYS=90
MAX_BACKUP_COUNT=20
DATA_RETENTION_MONTHS=19

# Production (optionnel)
SECURE_COOKIES=true
ALLOWED_DOMAIN=votre-domaine.com
```

## 3. Déploiement

```bash
# Construire et démarrer les services
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
docker-compose logs -f regisflow

# Les tables sont créées automatiquement au premier démarrage
```

## 4. Vérification

```bash
# Tester l'application
curl http://localhost:5000/health

# Voir les logs en temps réel
docker-compose logs -f

# Vérifier la base de données
docker-compose exec regisflow-db psql -U regisflow -d regisflow -c "\dt"
```

## 5. Accès à l'application

- **URL** : http://votre-serveur:5000
- **Admin** : admin / admin123
- **PostgreSQL** : localhost:5433 (depuis l'hôte)

## 6. Maintenance

```bash
# Arrêter l'application
docker-compose down

# Mise à jour
docker-compose pull
docker-compose up -d --force-recreate

# Sauvegardes manuelles
docker-compose exec regisflow npm run backup

# Voir l'utilisation des ressources
docker stats
```

## 7. Production avec reverse proxy (Nginx)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 8. Sécurité

- Changez POSTGRES_PASSWORD
- Changez SESSION_SECRET  
- Configurez un firewall
- Activez HTTPS avec Let's Encrypt
- Sauvegardez régulièrement le volume PostgreSQL