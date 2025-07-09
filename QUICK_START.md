# Démarrage Rapide RegisFlow - Production Docker

## 🚀 Déploiement en 5 minutes

### 1. Préparer l'environnement
```bash
# Cloner le projet
git clone <votre-repo>
cd regisflow

# Configurer l'environnement
cp .env.example .env
nano .env  # Changer POSTGRES_PASSWORD et SESSION_SECRET

# Créer les répertoires
mkdir -p data/{postgres,backups,logs}
```

### 2. Déployer
```bash
# Déploiement automatique
chmod +x deploy-prod.sh
./deploy-prod.sh

# OU déploiement manuel
docker-compose build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Accéder à l'application
- **URL** : http://localhost:5000
- **Utilisateur** : admin
- **Mot de passe** : admin123

### 4. Configuration initiale
1. Connectez-vous avec admin/admin123
2. Changez le mot de passe administrateur
3. Créez vos magasins et utilisateurs

## ⚡ Commandes essentielles

```bash
# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f

# Arrêter/démarrer
docker-compose down
docker-compose up -d

# Sauvegarde
docker-compose exec regisflow-db pg_dump -U regisflow regisflow > backup.sql
```

## 🔧 Variables obligatoires (.env)

```bash
# À changer OBLIGATOIREMENT
POSTGRES_PASSWORD=VotreMotDePasseSecurise2024!
SESSION_SECRET=$(openssl rand -base64 32)

# Configuration de base
NODE_ENV=production
PORT=5000
TZ=Europe/Paris
```

## 📊 Monitoring

```bash
# Script de monitoring
./monitoring.sh

# Santé des services
curl http://localhost:5000/health

# Ressources utilisées
docker stats
```

## 🔒 Sécurité

Pour la production, configurez HTTPS avec Nginx :

```bash
# Copier la configuration
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/regisflow
sudo ln -s /etc/nginx/sites-available/regisflow /etc/nginx/sites-enabled/

# Certificat SSL
sudo certbot --nginx -d votre-domaine.com
```

## 🚨 Dépannage

```bash
# Si un service ne démarre pas
docker-compose logs regisflow

# Si problème de base de données
docker-compose exec regisflow-db psql -U regisflow -d regisflow

# Redémarrer tout
docker-compose restart
```

## 📱 Fonctionnalités

- Multi-utilisateur (Admin/Manager/Employee)
- Multi-magasins avec isolation
- Sauvegardes automatiques
- Purge automatique (19 mois)
- Export PDF/CSV
- Validation EAN-13
- Interface mobile responsive

**🎯 L'application est maintenant prête pour la production !**