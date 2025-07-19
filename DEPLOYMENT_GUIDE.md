# Guide de Déploiement RegisFlow Production 2025

## Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 5GB espace disque minimum

## Installation Rapide

### 1. Cloner et Configurer

```bash
git clone <repository-url> regisflow
cd regisflow

# Copier et modifier la configuration
cp .env.production.example .env.production
nano .env.production
```

### 2. Modifier la Configuration

Dans `.env.production`, changez **obligatoirement** :

```env
# Mot de passe PostgreSQL sécurisé
POSTGRES_PASSWORD=VotreMotDePasseSecure2025!

# Clé de session unique (32+ caractères)
SESSION_SECRET=VotreCleDeSessionUnique2025_32CharacteresMinimum
```

### 3. Déployer

```bash
# Construction et démarrage
docker-compose up -d

# Vérifier les logs
docker-compose logs -f regisflow

# Vérifier l'état
docker-compose ps
```

## URLs d'Accès

- **Application** : http://localhost:5000
- **Health Check** : http://localhost:5000/health
- **Base de données** : localhost:5433

## Comptes par Défaut

- **Utilisateur** : admin
- **Mot de passe** : admin123

⚠️ **Important** : Changez le mot de passe admin dès la première connexion !

## Configuration Avancée

### Avec Reverse Proxy (Nginx)

1. Décommentez dans `docker-compose.yml` :
```yaml
networks:
  default:
    external: true
    name: nginx_default
```

2. Configuration Nginx :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://regisflow:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Sauvegarde Automatique

Les sauvegardes automatiques sont activées :
- **Fréquence** : Toutes les 12 heures (00:00 et 12:00)
- **Rétention** : 20 sauvegardes maximum
- **Emplacement** : Volume Docker `backup_data`

### Purge Automatique

Suppression automatique des données > 19 mois :
- **Fréquence** : 1er de chaque mois à 02:00
- **Conformité** : Réglementation française

## Surveillance et Maintenance

### Logs d'Application

```bash
# Logs en temps réel
docker-compose logs -f regisflow

# Logs PostgreSQL
docker-compose logs -f regisflow-db

# Dernières 100 lignes
docker-compose logs --tail=100 regisflow
```

### Health Checks

```bash
# Vérifier la santé des containers
docker-compose ps

# Test manuel du health check
curl http://localhost:5000/health
```

### Sauvegarde Manuelle

```bash
# Accéder au container
docker exec -it regisflow-app sh

# Interface admin pour sauvegardes manuelles
# Via l'application : Menu → Administration → Sauvegardes
```

### Mise à Jour

```bash
# Arrêter les services
docker-compose down

# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f regisflow
```

## Résolution de Problèmes

### Base de données inaccessible

```bash
# Vérifier PostgreSQL
docker-compose logs regisflow-db

# Redémarrer si nécessaire
docker-compose restart regisflow-db
```

### Application ne démarre pas

```bash
# Vérifier les logs de démarrage
docker-compose logs regisflow

# Vérifier les variables d'environnement
docker exec regisflow-app env | grep -E "(DATABASE_URL|SESSION_SECRET)"
```

### Problème de permissions

```bash
# Vérifier les volumes
docker volume inspect regisflow_backup_data

# Réinitialiser les permissions
docker-compose down
docker volume rm regisflow_backup_data regisflow_logs_data
docker-compose up -d
```

## Sécurité en Production

### 1. Variables d'Environnement

- ✅ `POSTGRES_PASSWORD` : Mot de passe complexe unique
- ✅ `SESSION_SECRET` : Clé de 32+ caractères aléatoires
- ✅ `SECURE_COOKIES=true` : Cookies sécurisés (HTTPS)

### 2. Réseau

- ✅ Isolation des containers
- ✅ Ports exposés uniquement nécessaires
- ✅ Reverse proxy recommandé pour HTTPS

### 3. Données

- ✅ Volumes Docker persistants
- ✅ Sauvegardes automatiques chiffrées
- ✅ Purge automatique conforme RGPD

## Support

Pour toute question technique :
1. Vérifiez les logs : `docker-compose logs -f`
2. Consultez le health check : `curl http://localhost:5000/health`
3. Vérifiez la configuration réseau et les ports

---

**RegisFlow 2025** - Gestion professionnelle des ventes de feux d'artifice