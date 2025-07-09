# Dockerfile multi-stage pour RegisFlow
FROM node:18-alpine AS builder

# Installer les dépendances système nécessaires
RUN apk add --no-cache python3 make g++

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (dev + prod pour la build)
RUN npm ci

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Stage de production
FROM node:18-alpine AS production

# Installer les dépendances système pour la production
RUN apk add --no-cache dumb-init postgresql-client

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S regisflow -u 1001

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer seulement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier les fichiers construits depuis le stage builder
COPY --from=builder --chown=regisflow:nodejs /app/dist ./dist
COPY --from=builder --chown=regisflow:nodejs /app/server ./server
COPY --from=builder --chown=regisflow:nodejs /app/shared ./shared
COPY --from=builder --chown=regisflow:nodejs /app/drizzle.config.ts ./drizzle.config.ts

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

# Démarrer l'application avec le script d'entrée
CMD ["docker-entrypoint.sh", "node", "dist/index.js"]