# Dockerfile pour RegisFlow
FROM node:18-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache dumb-init postgresql-client wget python3 make g++

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S regisflow -u 1001

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm ci && npm cache clean --force

# Copier le code source
COPY --chown=regisflow:nodejs . .

# Copier le script d'entrée
COPY --chown=regisflow:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Créer les répertoires nécessaires
RUN mkdir -p /app/backups && chown regisflow:nodejs /app/backups

# Changer vers l'utilisateur non-root
USER regisflow

# Exposer le port
EXPOSE 5000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Utiliser dumb-init pour gérer les signaux
ENTRYPOINT ["dumb-init", "--"]

# Démarrer avec le script d'entrée
CMD ["docker-entrypoint.sh"]