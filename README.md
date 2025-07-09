# RegisFlow

Application web complète de gestion des ventes de feux d'artifice en conformité avec la réglementation française.

## Fonctionnalités

- ✅ Authentification multi-utilisateur avec rôles (Admin, Manager, Employee)
- ✅ Gestion multi-magasins avec isolation des données
- ✅ Enregistrement des ventes conforme à la réglementation
- ✅ Sauvegardes automatiques toutes les 12h
- ✅ Purge automatique des données (19 mois de rétention)
- ✅ Export CSV/PDF pour rapports réglementaires
- ✅ Interface responsive avec design moderne

## Démarrage Rapide

### Développement
```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev
```

### Production avec Docker
```bash
# Démarrage simple
docker-compose up -d

# Vérification des logs
docker-compose logs -f regisflow
```

## Configuration

### Variables d'environnement (.env)
```env
DATABASE_URL=postgresql://regisflow:RegisFlow2024!PostgreSQL@regisflow-db:5432/regisflow
SESSION_SECRET=RegisFlow2024SessionSecretKey1234567890ABCDEF
NODE_ENV=production
PORT=5000
```

### Compte par défaut
- **Utilisateur** : admin
- **Mot de passe** : admin123

⚠️ **Important** : Changez le mot de passe par défaut après la première connexion.

## Architecture Technique

- **Frontend** : React 18 + TypeScript + TailwindCSS + shadcn/ui
- **Backend** : Express.js + TypeScript
- **Base de données** : PostgreSQL avec Drizzle ORM
- **Authentification** : Sessions sécurisées avec bcrypt
- **Déploiement** : Docker avec multi-stage build

## Scripts Disponibles

- `npm run dev` : Développement avec hot-reload
- `npm run build` : Construction pour production
- `npm run start` : Démarrage en production
- `npm run db:push` : Migration de base de données

## Structure du Projet

```
RegisFlow/
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Types partagés et schémas
├── backups/         # Sauvegardes automatiques
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Conformité Réglementaire

L'application respecte la réglementation française pour la vente de feux d'artifice :
- Enregistrement obligatoire des ventes
- Conservation des données pendant 19 mois
- Purge automatique des données expirées
- Traçabilité complète des transactions