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

Éditez le fichier `.env` :

```env
# Configuration de la base de données
DATABASE_URL=postgresql://regisflow:votre_mot_de_passe@postgres:5432/regisflow
POSTGRES_PASSWORD=votre_mot_de_passe_securise

# Configuration de l'application
NODE_ENV=production
PORT=5000

# Clé secrète pour les sessions (OBLIGATOIRE EN PRODUCTION)
SESSION_SECRET=votre-cle-secrete-super-longue-et-complexe

# Configuration du timezone
TZ=Europe/Paris
```

### 3. Lancer l'application

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Accéder à l'application
# http://localhost (avec nginx)
# ou http://localhost:5000 (accès direct)
```

## 📋 Services Inclus

### 1. PostgreSQL (Base de données)
- **Port**: 5432
- **Database**: regisflow
- **Utilisateur**: regisflow
- **Données persistantes**: Volume `postgres_data`

### 2. RegisFlow (Application)
- **Port**: 5000
- **Dépendances**: PostgreSQL
- **Sauvegardes**: Volume `backup_data`
- **Health check**: `/health`

### 3. Nginx (Reverse Proxy)
- **Port**: 80 (HTTP)
- **Port**: 443 (HTTPS - à configurer)
- **Compression**: Gzip activée
- **Cache**: Optimisé pour les assets statiques

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
# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U regisflow regisflow > backup.sql

# Restaurer la base de données
docker-compose exec -T postgres psql -U regisflow regisflow < backup.sql

# Accéder à la base de données
docker-compose exec postgres psql -U regisflow regisflow
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
docker volume inspect regisflow_postgres_data
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
   
   # Vérifier la base de données
   docker-compose logs postgres
   ```

2. **Erreur de connexion à la base** :
   ```bash
   # Vérifier que PostgreSQL est démarré
   docker-compose ps postgres
   
   # Tester la connexion
   docker-compose exec postgres pg_isready -U regisflow
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

### Personnalisation de Nginx

Éditez le fichier `nginx.conf` pour :
- Configurer SSL/TLS
- Ajouter des règles de sécurité
- Optimiser les performances

### Variables d'environnement complètes

```env
# Base de données
DATABASE_URL=postgresql://regisflow:password@postgres:5432/regisflow
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