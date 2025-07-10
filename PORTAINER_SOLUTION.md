# Solution Portainer pour RegisFlow

## Problème identifié
Portainer ne peut pas télécharger l'image `regisflow` car elle n'existe pas sur Docker Hub. Il faut construire l'image depuis le code source.

## Solution 1: Stack avec build automatique (RECOMMANDÉE)

### Étapes dans Portainer:

1. **Allez dans "Stacks"**
2. **Cliquez sur "Add stack"**
3. **Nom de la stack**: `regisflow`
4. **Méthode de build**: Repository
5. **Repository URL**: Collez l'URL de votre dépôt Git ou utilisez "Upload"
6. **Compose file**: Copiez le contenu de `portainer-build-stack.yml`
7. **Cliquez sur "Deploy the stack"**

### Contenu à copier dans Portainer:

```yaml
version: '3.8'

services:
  regisflow-db:
    image: postgres:15-alpine
    container_name: regisflow-db
    environment:
      POSTGRES_DB: regisflow
      POSTGRES_USER: regisflow
      POSTGRES_PASSWORD: RegisFlow2024!PostgreSQL
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U regisflow -d regisflow"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  regisflow:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: regisflow-app
    depends_on:
      regisflow-db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://regisflow:RegisFlow2024!PostgreSQL@regisflow-db:5432/regisflow
      SESSION_SECRET: RegisFlow2024SessionSecretKey1234567890ABCDEF
      TZ: Europe/Paris
    volumes:
      - backup_data:/app/backups
      - logs_data:/app/logs
    ports:
      - "5000:5000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1"]
      interval: 30s
      timeout: 15s
      retries: 3
      start_period: 90s

volumes:
  postgres_data:
  backup_data:
  logs_data:
```

## Solution 2: Construction manuelle puis image

Si la solution 1 ne fonctionne pas:

### Étape A: Sur votre serveur
```bash
# Téléchargez les fichiers RegisFlow sur votre serveur
# Puis construisez l'image:
docker build -t regisflow:latest .

# Vérifiez que l'image existe:
docker images | grep regisflow
```

### Étape B: Dans Portainer
Utilisez ensuite le fichier `portainer-stack.yml` original avec `image: regisflow:latest`

## Solution 3: Docker Hub personnel (avancée)

Si vous avez un compte Docker Hub:

```bash
# Taguez l'image avec votre nom d'utilisateur
docker tag regisflow:latest votre-username/regisflow:latest

# Poussez vers Docker Hub
docker push votre-username/regisflow:latest
```

Puis utilisez `votre-username/regisflow:latest` dans Portainer.

## Vérification du déploiement

### Dans Portainer:
1. Vérifiez que la stack est "Running"
2. Consultez les logs des conteneurs
3. Vérifiez les health checks

### Accès à l'application:
- URL: `http://votre-serveur:5000`
- Login: `admin`
- Mot de passe: `admin123`

### Tests de connectivité:
```bash
# Test de santé de l'application
curl http://localhost:5000/health

# Vérification PostgreSQL
docker exec regisflow-db pg_isready -U regisflow -d regisflow
```

## Résolution des problèmes courants

### Stack en échec de build:
1. Vérifiez que tous les fichiers sont présents
2. Consultez les logs de build dans Portainer
3. Vérifiez les droits d'accès au Dockerfile

### Conteneur qui ne démarre pas:
1. Vérifiez les logs du conteneur
2. Vérifiez les variables d'environnement
3. Attendez que PostgreSQL soit prêt (health check)

### Application inaccessible:
1. Vérifiez que le port 5000 est ouvert
2. Vérifiez les logs de l'application
3. Testez le health check: `/health`

## Points importants

✅ **Utilisez la Solution 1 avec build automatique**
✅ **Tous les fichiers sources doivent être disponibles pour Portainer**
✅ **PostgreSQL démarre en premier (health check)**
✅ **Volumes persistants pour les données**
✅ **Réseau dédié pour la communication inter-conteneurs**
✅ **Health checks configurés pour surveillance automatique**