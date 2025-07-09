# Dockerfile multi-stage pour RegisFlow Production
# Stage 1: Build
FROM node:18-alpine AS builder

# Installer les dépendances de build
RUN apk add --no-cache python3 make g++

# Créer le répertoire de build
WORKDIR /build

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (dev + prod)
RUN npm ci --include=dev

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

# Installer uniquement les dépendances système nécessaires pour production
RUN apk add --no-cache \
    dumb-init \
    postgresql-client \
    wget \
    curl \
    && rm -rf /var/cache/apk/*

# Créer un utilisateur non-root avec des permissions limitées
RUN addgroup -g 1001 -S nodejs && \
    adduser -S regisflow -u 1001 -G nodejs

# Créer les répertoires avec permissions appropriées
WORKDIR /app
RUN mkdir -p /app/backups /app/logs /app/data && \
    chown -R regisflow:nodejs /app

# Copier uniquement les fichiers nécessaires depuis le builder
COPY --from=builder --chown=regisflow:nodejs /build/package*.json ./
COPY --from=builder --chown=regisflow:nodejs /build/dist ./dist
COPY --from=builder --chown=regisflow:nodejs /build/shared ./shared
COPY --from=builder --chown=regisflow:nodejs /build/drizzle.config.ts ./
COPY --from=builder --chown=regisflow:nodejs /build/node_modules ./node_modules

# Les dépendances sont déjà copiées depuis le builder
# Nettoyer le cache npm uniquement
RUN npm cache clean --force && \
    rm -rf /tmp/*

# Copier les scripts de configuration
COPY --chown=regisflow:nodejs docker-entrypoint-simple.sh /usr/local/bin/docker-entrypoint.sh
COPY --chown=regisflow:nodejs postgres-prod.conf ./
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Changer vers l'utilisateur non-root
USER regisflow

# Exposer le port
EXPOSE 5000

# Variables d'environnement de production
ENV NODE_ENV=production
ENV PORT=5000
ENV NODE_OPTIONS="--max-old-space-size=512"

# Labels pour la documentation
LABEL maintainer="RegisFlow Team"
LABEL version="1.0.0"
LABEL description="Application RegisFlow pour la gestion des ventes de feux d'artifice"

# Health check amélioré
HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Utiliser dumb-init pour gérer les signaux
ENTRYPOINT ["dumb-init", "--"]

# Démarrer avec le script d'entrée
CMD ["docker-entrypoint.sh"]