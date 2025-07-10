# Guide de déploiement Portainer pour RegisFlow

## Problème résolu
L'erreur `regisflow-regisflow:latest` vient du fait que Portainer cherche une image sur Docker Hub qui n'existe pas.

## Solution complète

### Étape 1: Construire l'image sur votre serveur

```bash
# Connectez-vous à votre serveur et allez dans le dossier RegisFlow
cd /chemin/vers/regisflow

# Construisez l'image Docker
docker build -t regisflow:latest .

# Vérifiez que l'image est créée
docker images | grep regisflow
```

### Étape 2: Créer la Stack dans Portainer

1. **Ouvrez Portainer** dans votre navigateur
2. **Allez dans "Stacks"**
3. **Cliquez sur "Add stack"**
4. **Donnez un nom** : `regisflow`
5. **Copiez le contenu** du fichier `portainer-stack.yml`
6. **Cliquez sur "Deploy the stack"**

### Étape 3: Configuration alternative (Container unique)

Si vous préférez créer un conteneur unique :

1. **Allez dans "Containers"**
2. **Cliquez sur "Add container"**
3. **Nom** : `regisflow-app`
4. **Image** : `regisflow:latest`
5. **Port mapping** : `5000:5000`
6. **Variables d'environnement** :
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://regisflow:RegisFlow2024!PostgreSQL@regisflow-db:5432/regisflow
   SESSION_SECRET=RegisFlow2024SessionSecretKey1234567890ABCDEF
   ```

## Script automatique

Pour simplifier le processus :

```bash
# Exécutez le script de déploiement
./deploy-portainer.sh
```

## Vérification du déploiement

### Vérifier les conteneurs
```bash
docker ps | grep regisflow
```

### Vérifier les logs
```bash
docker logs regisflow-app
```

### Tester l'application
```bash
curl http://localhost:5000/health
```

## Résolution des problèmes

### Si l'image n'est pas trouvée
1. Vérifiez que vous êtes sur le bon serveur
2. Reconstruisez l'image : `docker build -t regisflow:latest .`
3. Vérifiez avec : `docker images | grep regisflow`

### Si Portainer ne trouve pas l'image
1. L'image doit être construite sur le même serveur que Portainer
2. Utilisez exactement le nom : `regisflow:latest`
3. Pas de préfixe `docker.io/library/`

### Si la base de données ne se connecte pas
1. Vérifiez que PostgreSQL est démarré
2. Vérifiez la variable `DATABASE_URL`
3. Attendez que le health check passe (30-60 secondes)

## Points importants

- ✅ L'image doit être construite localement
- ✅ Utilisez `regisflow:latest` (pas `regisflow-regisflow:latest`)
- ✅ PostgreSQL inclus dans la stack
- ✅ Volumes persistants pour les données
- ✅ Health checks configurés
- ✅ Ports : 5000 (app) et 5433 (PostgreSQL)

## Accès à l'application

Une fois déployé :
- **URL** : `http://votre-serveur:5000`
- **Connexion** : `admin` / `admin123`
- **Changez le mot de passe** après la première connexion