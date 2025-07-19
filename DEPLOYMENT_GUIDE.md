# RegisFlow - Guide de Déploiement Production 2025

## 🚀 Déploiement Rapide

### Prérequis
- Docker 20.10+ et Docker Compose 2.0+
- Base de données PostgreSQL externe ou utiliser le docker-compose fourni
- Au minimum 2GB RAM et 5GB d'espace disque libre

### Installation Express

```bash
# 1. Cloner le repository
git clone <votre-repo> regisflow
cd regisflow

# 2. Créer le fichier de configuration
cp .env.production.example .env.production

# 3. Modifier les variables critiques (OBLIGATOIRE)
nano .env.production
# Changer POSTGRES_PASSWORD et SESSION_SECRET

# 4. Démarrer l'application
docker-compose up -d

# 5. Vérifier le déploiement
curl http://localhost:5000/health
```

## 🔧 Configuration Production

### Variables d'Environnement (.env.production)

```env
# DATABASE - OBLIGATOIRE à modifier
POSTGRES_PASSWORD=VotreMotDePasseSecure2025!
DATABASE_URL=postgresql://regisflow:VotreMotDePasseSecure2025!@regisflow-db:5432/regisflow

# SECURITY - OBLIGATOIRE à modifier  
SESSION_SECRET=VotreCleDeSessionUnique32Caracteres+

# APPLICATION
NODE_ENV=production
APP_PORT=5000
POSTGRES_PORT=5433

# SÉCURITÉ
SECURE_COOKIES=true

# DONNÉES
DATA_RETENTION_MONTHS=19
```

### Sécurité Importante

⚠️ **ATTENTION** : Changez toujours ces variables avant le déploiement :
- `POSTGRES_PASSWORD` : Mot de passe fort (16+ caractères)  
- `SESSION_SECRET` : Clé unique (32+ caractères)

## 🐳 Docker Compose

### Démarrage
```bash
# Premier démarrage
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêt
docker-compose down

# Redémarrage complet
docker-compose down && docker-compose up -d
```

### Architecture

```yaml
services:
  regisflow-db:     # PostgreSQL 16 avec persistence
  regisflow:        # Application RegisFlow optimisée
```

## 📊 Monitoring et Santé

### Health Checks

```bash
# Status général
curl http://localhost:5000/health

# Informations détaillées
curl http://localhost:5000/health | jq .

# Vérifier la base de données
docker exec regisflow-db pg_isready -U regisflow
```

### Logs

```bash
# Application
docker-compose logs regisflow

# Base de données
docker-compose logs regisflow-db

# Temps réel
docker-compose logs -f
```

## 🔍 Troubleshooting

### Problèmes Courants

#### 1. Erreur "docker-entrypoint.sh: No such file or directory"
```bash
# Solution : Rebuild avec cache vidé
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Base de données inaccessible
```bash
# Vérifier la connexion
docker exec regisflow-db pg_isready -U regisflow

# Redémarrer la DB
docker-compose restart regisflow-db

# Logs de la DB
docker-compose logs regisflow-db
```

#### 3. Migration échoue
```bash
# Exécuter manuellement
docker exec regisflow npm run db:push

# Vérifier les tables
docker exec regisflow-db psql -U regisflow -c "\dt"
```

#### 4. Permissions d'accès
```bash
# Nettoyer les volumes
docker-compose down
docker volume prune
docker-compose up -d
```

### Tests de Diagnostic

```bash
# Status complet
docker-compose ps

# Utilisation des ressources
docker stats regisflow regisflow-db

# Espace disque
docker system df

# Réseau
docker network ls | grep regisflow
```

## 🔒 Sécurité Production

### Configuration Système
- Application s'exécute avec utilisateur non-root
- Conteneurs en lecture seule (tmpfs pour /tmp)
- Ressources CPU/RAM limitées
- Health checks automatiques

### Base de Données
- Authentication SCRAM-SHA-256
- Isolation réseau entre conteneurs
- Volumes persistants chiffrés
- Sauvegardes automatiques

### Application
- Sessions sécurisées (HttpOnly cookies)
- HTTPS enforcement (en production)
- Validation stricte des entrées
- Audit trail complet

## 📁 Structure Production

```
regisflow/
├── docker-compose.yml      # Configuration production
├── Dockerfile             # Build multi-stage optimisé
├── docker-entrypoint.sh   # Script de démarrage
├── .env.production        # Variables de production
├── init.sql              # Schema initial PostgreSQL
└── dist/                 # Application compilée
    ├── index.js          # Serveur Express
    └── public/           # Assets client
```

## 🚀 Déploiement Avancé

### Avec Reverse Proxy (nginx)

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

### Surveillance Continue

```bash
# Monitoring en continu
watch -n 30 'curl -s http://localhost:5000/health | jq .'

# Alertes Slack/Discord (exemple)
curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"RegisFlow Health: OK"}' \
    YOUR_WEBHOOK_URL
```

## 📈 Performance

### Ressources Recommandées
- **Development** : 1GB RAM, 2GB disque
- **Production** : 2GB RAM, 10GB disque  
- **Enterprise** : 4GB RAM, 50GB disque

### Optimisations
- Node.js 20 avec optimisations V8
- PostgreSQL 16 avec indexation optimisée
- Gzip compression activée
- Cache statique pour assets

---

**RegisFlow Production Ready 2025**

Support: [Votre email/contact]
Documentation: [Lien vers docs complètes]