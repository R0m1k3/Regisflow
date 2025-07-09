# Guide de Déploiement Production RegisFlow

## Pré-requis

1. **Docker et Docker Compose installés**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io docker-compose
   
   # CentOS/RHEL
   sudo yum install docker docker-compose
   ```

2. **Cloner le projet**
   ```bash
   git clone <votre-repo-regisflow>
   cd regisflow
   ```

## Configuration de Production

### 1. Créer le fichier d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos valeurs
nano .env
```

### 2. Configurer les variables OBLIGATOIRES

Dans le fichier `.env`, changez OBLIGATOIREMENT :

```bash
# Générer un mot de passe fort pour PostgreSQL
POSTGRES_PASSWORD=VotreMotDePassePostgreSQL2024!

# Générer une clé secrète pour les sessions
SESSION_SECRET=$(openssl rand -base64 32)
```

### 3. Créer les répertoires de données

```bash
# Créer les répertoires nécessaires
mkdir -p data/{postgres,backups,logs,postgres-logs}
chmod 755 data data/*
```

## Déploiement Automatique

### Option 1 : Script de déploiement automatique

```bash
# Rendre le script exécutable
chmod +x deploy-prod.sh

# Exécuter le déploiement
./deploy-prod.sh
```

### Option 2 : Déploiement manuel

```bash
# Construire les images
docker-compose build

# Démarrer les services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Vérifier le statut
docker-compose ps
```

## Vérification du Déploiement

1. **Vérifier les services**
   ```bash
   docker-compose ps
   ```

2. **Accéder à l'application**
   - RegisFlow : http://localhost:5000
   - PostgreSQL : localhost:5433

3. **Vérifier les logs**
   ```bash
   # Logs application
   docker-compose logs regisflow

   # Logs base de données
   docker-compose logs regisflow-db
   ```

## Connexion Initiale

1. **Compte administrateur par défaut**
   - Utilisateur : `admin`
   - Mot de passe : `admin123`

2. **Première connexion**
   - Connectez-vous avec les identifiants par défaut
   - Changez IMMÉDIATEMENT le mot de passe administrateur
   - Créez vos utilisateurs et magasins

## Maintenance

### Sauvegardes

```bash
# Sauvegarde manuelle
docker-compose exec regisflow-db pg_dump -U regisflow regisflow > backup_$(date +%Y%m%d).sql

# Sauvegarde automatique (déjà configurée dans l'app)
# - Toutes les 12 heures
# - Conservation des 10 dernières sauvegardes
```

### Monitoring

```bash
# Utiliser le script de monitoring
./monitoring.sh

# Ou manuellement
docker-compose logs -f
docker stats
```

### Mise à jour

```bash
# Arrêter les services
docker-compose down

# Récupérer les mises à jour
git pull

# Reconstruire et redémarrer
docker-compose build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Sécurité Production

### Configuration HTTPS (Recommandé)

1. **Installer Nginx**
   ```bash
   sudo apt install nginx
   ```

2. **Configurer le reverse proxy**
   ```bash
   # Copier la configuration Nginx
   sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/regisflow
   sudo ln -s /etc/nginx/sites-available/regisflow /etc/nginx/sites-enabled/
   
   # Redémarrer Nginx
   sudo systemctl restart nginx
   ```

3. **Obtenir un certificat SSL**
   ```bash
   # Installer Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Obtenir le certificat
   sudo certbot --nginx -d votre-domaine.com
   ```

### Sécurisation

1. **Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Permissions**
   ```bash
   chmod 600 .env
   chown root:root .env
   ```

## Dépannage

### Problèmes courants

1. **Service ne démarre pas**
   ```bash
   docker-compose logs regisflow
   ```

2. **Base de données non accessible**
   ```bash
   docker-compose exec regisflow-db psql -U regisflow -d regisflow
   ```

3. **Erreur de migration**
   ```bash
   docker-compose exec regisflow npx drizzle-kit push
   ```

### Commandes utiles

```bash
# Redémarrer un service
docker-compose restart regisflow

# Accéder au container
docker-compose exec regisflow sh

# Voir les ressources utilisées
docker stats

# Nettoyer les volumes (ATTENTION : supprime les données)
docker-compose down -v
```

## Support

- **Documentation** : README.md
- **Configuration** : .env.example
- **Logs** : `docker-compose logs -f`
- **Monitoring** : `./monitoring.sh`

## Caractéristiques Production

- ✅ Multi-utilisateur avec rôles (Admin, Manager, Employee)
- ✅ Multi-magasins avec isolation des données
- ✅ Sauvegardes automatiques toutes les 12 heures
- ✅ Purge automatique des données > 19 mois
- ✅ Interface responsive mobile/desktop
- ✅ Export PDF et CSV
- ✅ Validation EAN-13 et conformité réglementaire
- ✅ Sécurité par défaut (HTTPS, sessions sécurisées)
- ✅ Monitoring et health checks
- ✅ Conteneurs sécurisés (utilisateur non-root)