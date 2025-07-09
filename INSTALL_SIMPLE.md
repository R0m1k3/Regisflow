# Installation Simple RegisFlow

## 🎯 Installation Sans Intervention

RegisFlow est maintenant configuré pour une installation complètement automatique sans aucune intervention manuelle.

## 🚀 Installation en 2 Commandes

### Option 1 : Installation automatique (Recommandé)

```bash
# Installation complète en une commande
./install-simple.sh
```

### Option 2 : Installation manuelle

```bash
# Construire et démarrer (configuration simple)
docker-compose build
docker-compose up -d
```

## ✅ Configuration Automatique

- **Mots de passe pré-configurés** : Aucune modification nécessaire
- **Base de données** : Configuration automatique PostgreSQL
- **Sessions** : Clé secrète pré-générée
- **Répertoires** : Création automatique des dossiers de données
- **Migrations** : Exécution automatique au démarrage

## 📊 Accès Immédiat

- **URL** : http://localhost:5000
- **Utilisateur** : admin
- **Mot de passe** : admin123
- **PostgreSQL** : localhost:5433

## 🔧 Mots de Passe Pré-configurés

```bash
# PostgreSQL
POSTGRES_PASSWORD=RegisFlow2024!PostgreSQL

# Sessions
SESSION_SECRET=RegisFlow2024SessionSecretKey1234567890ABCDEF

# Compte admin par défaut
Utilisateur: admin
Mot de passe: admin123
```

## 📋 Commandes de Base

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Vérifier le statut
docker-compose ps
```

## 🔒 Sécurité pour Production

Une fois l'installation testée, pour la production :

1. **Changez les mots de passe** dans le fichier `.env`
2. **Configurez HTTPS** avec un reverse proxy
3. **Changez le mot de passe admin** dans l'interface

## 🛠️ Dépannage

```bash
# Si un service ne démarre pas
docker-compose logs regisflow

# Redémarrer tous les services
docker-compose restart

# Nettoyer et redémarrer
docker-compose down
docker-compose up -d
```

## 📱 Fonctionnalités Disponibles

- ✅ Multi-utilisateur (Admin/Manager/Employee)
- ✅ Multi-magasins avec isolation
- ✅ Sauvegardes automatiques
- ✅ Purge automatique (19 mois)
- ✅ Export PDF/CSV
- ✅ Validation EAN-13
- ✅ Interface mobile responsive

## 🎉 Installation Terminée !

L'application RegisFlow est maintenant accessible sur http://localhost:5000 avec le compte admin/admin123.

**Aucune configuration supplémentaire n'est nécessaire pour commencer à utiliser l'application.**