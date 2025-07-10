# Déploiement Docker pour RegisFlow

## Problème résolu : Image Docker manquante

### Le problème
Portainer essayait de télécharger une image `regisflow-regisflow:latest` qui n'existe pas sur Docker Hub.

### Solution
L'image doit être construite localement avant utilisation.

## Instructions de déploiement

### 1. Construction de l'image Docker
```bash
# Méthode 1: Utiliser le script automatique
./build-docker.sh

# Méthode 2: Construction manuelle
docker build -t regisflow:latest .
```

### 2. Démarrage avec Docker Compose
```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

### 3. Configuration dans Portainer
1. Utiliser le nom d'image : `regisflow:latest`
2. Ou utiliser la configuration Docker Compose existante
3. L'image sera trouvée localement après construction

## Vérification du déploiement

### Vérifier que l'image existe
```bash
docker images | grep regisflow
```

### Vérifier les logs
```bash
docker-compose logs -f regisflow
```

### Tester la santé de l'application
```bash
curl http://localhost:5000/health
```

## Notes importantes
- L'image doit être construite sur le serveur de déploiement
- La base de données PostgreSQL est incluse dans la configuration
- Les volumes sont persistants pour les sauvegardes et données
- Le port 5000 est exposé pour l'application
- Le port 5433 est exposé pour PostgreSQL (pour éviter les conflits)

## Résolution des problèmes courants

### Si l'image n'est pas trouvée
1. Vérifier que l'image a été construite : `docker images`
2. Reconstruire si nécessaire : `docker build -t regisflow:latest .`

### Si le conteneur ne démarre pas
1. Vérifier les logs : `docker-compose logs regisflow`
2. Vérifier la connectivité réseau : `docker network ls`
3. Vérifier les variables d'environnement

### Si PostgreSQL ne se connecte pas
1. Vérifier que le conteneur DB est en cours d'exécution
2. Vérifier la variable DATABASE_URL
3. Attendre que le healthcheck PostgreSQL passe (30s)