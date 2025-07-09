# RegisFlow - Déploiement Docker

Ce guide vous explique comment déployer RegisFlow avec Docker et Docker Compose.

## 🐳 Prérequis

- Docker Engine 20.10 ou supérieur
- Docker Compose 2.0 ou supérieur
- Au minimum 1 GB de RAM libre
- Au minimum 2 GB d'espace disque libre

## 🚀 Démarrage Rapide

### 1. Préparer l'environnement

```bash
# Cloner le projet
git clone <votre-repo>
cd regisflow

# Copier et configurer le fichier d'environnement
cp .env.example .env

# Éditer le fichier .env avec vos paramètres
nano .env
```

### 2. Configurer les variables d'environnement

Éditez le fichier `.env` avec votre serveur PostgreSQL externe :

```env
# Configuration de la base de données EXTERNE (PRÉCONFIGURÉE)
DATABASE_URL=postgresql://regisflow:RegisFlow2024!@VOTRE_IP_POSTGRES:5433/regisflow

# Configuration de l'application
NODE_ENV=production
PORT=5000

# Clé secrète pour les sessions (OBLIGATOIRE EN PRODUCTION)
SESSION_SECRET=votre-cle-secrete-super-longue-et-complexe

# Configuration du timezone
TZ=Europe/Paris
```

### Préparation de votre serveur PostgreSQL

**1. Se connecter à PostgreSQL :**
```sql
sudo -u postgres psql
```

**2. Créer l'utilisateur et la base (préconfigurés) :**
```sql
CREATE USER regisflow WITH PASSWORD 'RegisFlow2024!';
CREATE DATABASE regisflow OWNER regisflow;
GRANT ALL PRIVILEGES ON DATABASE regisflow TO regisflow;
\q
```

**3. Configuration réseau PostgreSQL :**
Éditez `/etc/postgresql/*/main/postgresql.conf` :
```
listen_addresses = '*'
```

Éditez `/etc/postgresql/*/main/pg_hba.conf` :
```
host regisflow regisflow 0.0.0.0/0 md5
```

**4. Redémarrer PostgreSQL :**
```bash
sudo systemctl restart postgresql
```

**SEULE MODIFICATION NÉCESSAIRE** : Remplacer `VOTRE_IP_POSTGRES` par l'IP réelle de votre serveur.

### 3. Lancer l'application

**Option 1 : Script automatique (recommandé)**
```bash
# Utiliser le script de déploiement automatique
chmod +x deploy.sh
./deploy.sh
```

**Option 2 : Commandes manuelles**
```bash
# Construire et démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Accéder à l'application
# http://localhost:5000
```

## 📋 Services Inclus

### RegisFlow (Application)
- **Port**: 5000
- **Base de données**: PostgreSQL externe (configurée via DATABASE_URL)
- **Sauvegardes**: Volume `backup_data`
- **Health check**: `/health`

### Configuration PostgreSQL Externe
- **Prérequis**: Serveur PostgreSQL accessible depuis Docker
- **Port**: 5433 (standard pour PostgreSQL externe)
- **Configuration**: Via variable d'environnement DATABASE_URL
- **Accès réseau**: Le container doit pouvoir accéder à l'IP de votre serveur PostgreSQL
- **Firewall**: Autoriser les connexions depuis l'IP du container Docker



## 🔧 Commandes Utiles

### Gestion des services

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Redémarrer un service
docker-compose restart regisflow

# Voir les logs
docker-compose logs -f regisflow

# Voir le statut des services
docker-compose ps
```

### Gestion des données

```bash
# Sauvegarder la base de données externe
pg_dump -h IP_SERVEUR -p 5433 -U regisflow regisflow > backup.sql

# Restaurer la base de données externe
psql -h IP_SERVEUR -p 5433 -U regisflow regisflow < backup.sql

# Accéder à la base de données externe
psql -h IP_SERVEUR -p 5433 -U regisflow regisflow

# Connexion à la base externe
psql -h IP_SERVEUR -p 5433 -U regisflow regisflow
```

### Maintenance

```bash
# Mettre à jour l'application
docker-compose pull
docker-compose up -d --build

# Nettoyer les images inutilisées
docker system prune -f

# Voir l'utilisation des volumes
docker volume ls
docker volume inspect regisflow_backup_data
```

## 🛡️ Sécurité

### Configuration de production

1. **Changez les mots de passe par défaut** :
   - `POSTGRES_PASSWORD`
   - `SESSION_SECRET`

2. **Configurez HTTPS** :
   - Obtenez un certificat SSL
   - Modifiez `nginx.conf` pour le HTTPS
   - Activez `secure: true` pour les cookies

3. **Limitez l'accès réseau** :
   - Utilisez un firewall
   - Limitez l'accès aux ports nécessaires

### Sauvegarde automatique

L'application inclut un système de sauvegarde automatique :
- Sauvegarde toutes les 12 heures
- Conservation des 10 dernières sauvegardes
- Stockage dans le volume `backup_data`

## 📊 Surveillance

### Health Checks

```bash
# Vérifier la santé de l'application
curl http://localhost:5000/health

# Vérifier via Docker
docker-compose exec regisflow wget -qO- http://localhost:5000/health
```

### Métriques

```bash
# Statistiques des conteneurs
docker stats

# Utilisation des volumes
docker system df
```

## 🔧 Dépannage

### Problèmes courants

1. **L'application ne démarre pas** :
   ```bash
   # Vérifier les logs
   docker-compose logs regisflow
   
   # Vérifier la connexion à la base externe
   docker-compose exec regisflow pg_isready -h IP_SERVEUR -p 5433 -U regisflow
   ```

2. **Erreur de connexion à la base** :
   ```bash
   # Vérifier que PostgreSQL externe est accessible
   docker-compose exec regisflow pg_isready -h IP_SERVEUR -p 5433 -U regisflow
   
   # Tester la connectivité réseau
   docker-compose exec regisflow nc -zv IP_SERVEUR 5433
   ```

3. **Problème de permissions** :
   ```bash
   # Vérifier les permissions des volumes
   docker-compose exec regisflow ls -la /app/backups
   ```

### Réinitialisation complète

```bash
# Arrêter tous les services
docker-compose down

# Supprimer les volumes (ATTENTION: perte de données)
docker-compose down -v

# Nettoyer les images
docker system prune -af

# Redémarrer
docker-compose up -d
```

## 🔄 Mise à jour

### Mise à jour de l'application

```bash
# Récupérer les dernières modifications
git pull origin main

# Reconstruire et redémarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f regisflow
```

### Migration de données

L'application gère automatiquement les migrations de base de données au démarrage.

## 📝 Configuration Avancée

### Accès via Reverse Proxy (Optionnel)

Si vous souhaitez ajouter un reverse proxy (Nginx, Apache, etc.) :
- Configurez le proxy pour pointer vers `localhost:5000`
- Ajoutez la configuration SSL/TLS si nécessaire
- Optimisez les performances selon vos besoins

### Variables d'environnement complètes

```env
# Base de données
DATABASE_URL=postgresql://regisflow:RegisFlow2024!@IP_SERVEUR:5433/regisflow
POSTGRES_PASSWORD=password

# Application
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secret-key

# Timezone
TZ=Europe/Paris

# Sauvegardes (optionnel)
BACKUP_RETENTION_DAYS=30
MAX_BACKUP_COUNT=10

# Logs (optionnel)
LOG_LEVEL=info
```

## 🆘 Support

En cas de problème :

1. Vérifiez les logs : `docker-compose logs`
2. Consultez la documentation
3. Vérifiez les issues sur GitHub
4. Contactez le support

## 📚 Liens Utiles

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation Nginx](https://nginx.org/en/docs/)