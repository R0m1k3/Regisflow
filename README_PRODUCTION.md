# RegisFlow - Application de Production

## 🎯 Application Prête pour la Production

RegisFlow est maintenant entièrement configurée pour un déploiement en production sous Docker avec toutes les fonctionnalités de sécurité et de performance nécessaires.

## 🚀 Déploiement Immédiat

### Option 1 : Déploiement automatique (Recommandé)

```bash
# 1. Configurer l'environnement
cp .env.example .env
nano .env  # Changez POSTGRES_PASSWORD et SESSION_SECRET

# 2. Créer les répertoires
mkdir -p data/{postgres,backups,logs}

# 3. Déployer automatiquement
./deploy-prod.sh
```

### Option 2 : Déploiement manuel

```bash
# 1. Construire les images
docker-compose build

# 2. Démarrer en production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Vérifier le statut
docker-compose ps
```

## 📊 Accès à l'Application

- **URL** : http://localhost:5000
- **Compte par défaut** : admin / admin123
- **PostgreSQL** : localhost:5433

## 🔧 Configuration Minimale Requise

Dans le fichier `.env`, changez OBLIGATOIREMENT :

```bash
# Mot de passe PostgreSQL fort
POSTGRES_PASSWORD=VotreMotDePasseSecurise2024!

# Clé secrète pour sessions (générez avec: openssl rand -base64 32)
SESSION_SECRET=VotreCleSecreteFortePourLesSessions
```

## 🔒 Sécurité Production

- ✅ Utilisateur non-root dans les conteneurs
- ✅ Réseau Docker isolé
- ✅ Sessions sécurisées avec PostgreSQL
- ✅ Health checks automatiques
- ✅ Limites de ressources définies
- ✅ Configuration HTTPS prête (avec Nginx)

## 📱 Fonctionnalités Intégrées

- **Multi-utilisateur** : Admin, Manager, Employee
- **Multi-magasins** : Isolation complète des données
- **Conformité réglementaire** : Validation EAN-13, purge 19 mois
- **Sauvegardes automatiques** : Toutes les 12 heures
- **Export de données** : PDF, CSV
- **Interface responsive** : Mobile et desktop
- **Monitoring intégré** : Logs et métriques

## 🚨 Commandes Essentielles

```bash
# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f regisflow

# Arrêter/Redémarrer
docker-compose down
docker-compose up -d

# Sauvegarde manuelle
docker-compose exec regisflow-db pg_dump -U regisflow regisflow > backup.sql

# Monitoring
./monitoring.sh
```

## 📋 Prochaines Étapes

1. **Configurez HTTPS** avec Nginx (configuration incluse)
2. **Changez le mot de passe admin** lors de la première connexion
3. **Créez vos magasins et utilisateurs**
4. **Testez les sauvegardes**
5. **Configurez le monitoring**

## 📞 Support

- **Guide complet** : DEPLOYMENT_GUIDE.md
- **Démarrage rapide** : QUICK_START.md
- **Configuration** : .env.example
- **Logs** : `docker-compose logs -f`

**🎉 L'application est maintenant prête pour la production !**

Consultez `DEPLOYMENT_GUIDE.md` pour la configuration complète et `QUICK_START.md` pour un démarrage rapide.