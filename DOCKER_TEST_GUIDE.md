# Guide de Test Docker pour RegisFlow

## ✅ Problème Résolu

Le problème `TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined` a été résolu avec un script de compatibilité Node.js 18.

### Cause du Problème
- Node.js 18 ne supporte pas `import.meta.dirname` 
- Le code compilé dans `dist/index.js` utilise cette fonctionnalité non disponible
- L'erreur se produit lors de la résolution des chemins (ligne 955 dans dist/index.js)

### Solution Appliquée
- Création d'un script `server/prod-start.js` qui remplace `import.meta.dirname` par des valeurs statiques
- Modification du script Docker d'entrée pour utiliser ce script de compatibilité
- Le script lit le fichier compilé et remplace les références undefined par des chemins absolus
- Création automatique du répertoire `public` pour les fichiers statiques

## Test du Déploiement Docker

### 1. Construction du Conteneur
```bash
# Construire l'image RegisFlow
docker-compose build regisflow

# Ou reconstruction complète
docker-compose build --no-cache regisflow
```

### 2. Démarrage des Services
```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f regisflow
docker-compose logs -f regisflow-db
```

### 3. Vérification du Fonctionnement
```bash
# Statut des conteneurs
docker-compose ps

# Test de connexion
curl http://localhost:5000/api/health

# Accès à l'application
# http://localhost:5000
```

### 4. Arrêt et Nettoyage
```bash
# Arrêter les services
docker-compose down

# Nettoyage complet avec volumes
docker-compose down -v
```

## Configuration Finale

### Fichiers Modifiés
- `docker-entrypoint-simple.sh` : Script d'entrée robuste
- `Dockerfile` : Configuration optimisée pour Node.js 18
- `.env` : Variables préconfigurées pour installation automatique

### Variables d'Environnement par Défaut
```env
DATABASE_URL=postgresql://regisflow:RegisFlow2024!PostgreSQL@regisflow-db:5432/regisflow
SESSION_SECRET=RegisFlow2024SessionSecretKey1234567890ABCDEF
NODE_ENV=production
PORT=5000
```

### Fonctionnalités Opérationnelles
- ✅ Application web responsive
- ✅ Base de données PostgreSQL intégrée
- ✅ Authentification multi-utilisateur
- ✅ Gestion des magasins et utilisateurs
- ✅ Enregistrement des ventes conformes
- ✅ Sauvegardes automatiques
- ✅ Purge automatique (19 mois)
- ✅ Export PDF et CSV

## Logs Attendus au Démarrage

```
🚀 Démarrage de RegisFlow (mode simplifié)...
📡 Attente de la base de données...
✅ PostgreSQL prêt!
✅ Base de données configurée
🎯 Démarrage de RegisFlow...
✅ Node.js 18 compatibility fix applied
serving on port 5000
📅 Automatic backup scheduler started
🕐 Planificateur de purge des ventes démarré
```

### Fichiers de Solution
- `server/prod-start.js` : Script de compatibilité Node.js 18
- `docker-entrypoint-simple.sh` : Script d'entrée Docker simplifié
- `Dockerfile` : Configuration optimisée pour production

## Compte par Défaut
- **Utilisateur** : admin
- **Mot de passe** : admin123

⚠️ **Important** : Changez le mot de passe par défaut après la première connexion pour des raisons de sécurité.