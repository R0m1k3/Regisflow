# Registre des Ventes de Pétards

Application React complète pour la gestion et le suivi des ventes de feux d'artifice en conformité avec la réglementation française.

## Fonctionnalités

### 🔐 Système d'authentification
- Connexion par nom d'utilisateur et mot de passe
- Système de rôles : Administrateur, Manager, Employé
- Sessions sécurisées avec PostgreSQL

### 👥 Gestion des utilisateurs et magasins
- **Administrateur** : Accès complet à toutes les fonctionnalités
- **Manager** : Accès à toutes les fonctionnalités sauf l'administration et les sauvegardes automatiques
- **Employé** : Création de ventes et consultation de l'historique uniquement

### 🏪 Multi-magasins
- Chaque magasin a son propre historique de ventes
- Les utilisateurs sont liés à un magasin spécifique
- Isolation des données par magasin

### 📋 Enregistrement des ventes
- Formulaire complet avec validation des champs obligatoires
- Support des codes EAN13 avec validation
- Capture photo des pièces d'identité
- Classification des produits (F2/F3)

### 📊 Historique et export
- Historique des ventes avec filtrage par dates
- Export CSV pour la conformité réglementaire
- Suppression des ventes (Manager et Administrateur uniquement)

## Installation et démarrage

1. **Installation des dépendances :**
   ```bash
   npm install
   ```

2. **Configuration de la base de données :**
   ```bash
   npm run db:push
   ```

3. **Démarrage de l'application :**
   ```bash
   npm run dev
   ```

## 🔑 Compte administrateur par défaut

Lors de la première installation sur une base de données vierge, un compte administrateur est automatiquement créé :

**Nom d'utilisateur :** `admin`
**Mot de passe :** `admin123`

⚠️ **IMPORTANT** : Changez ce mot de passe immédiatement après la première connexion !

## Configuration

### Variables d'environnement
- `DATABASE_URL` : URL de connexion PostgreSQL
- `SESSION_SECRET` : Clé secrète pour les sessions (optionnel, une clé par défaut est générée)

### Structure des rôles

#### Administrateur
- ✅ Création et gestion des utilisateurs
- ✅ Création et gestion des magasins
- ✅ Accès à toutes les ventes de tous les magasins
- ✅ Suppression des ventes
- ✅ Export des données
- ✅ Sauvegardes automatiques

#### Manager
- ✅ Création de ventes
- ✅ Consultation de l'historique du magasin
- ✅ Suppression des ventes
- ✅ Export des données
- ❌ Administration des utilisateurs/magasins
- ❌ Sauvegardes automatiques

#### Employé
- ✅ Création de ventes
- ✅ Consultation de l'historique du magasin
- ❌ Suppression des ventes
- ❌ Export des données
- ❌ Administration
- ❌ Sauvegardes automatiques

## Technologies utilisées

- **Frontend** : React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend** : Express.js, TypeScript
- **Base de données** : PostgreSQL avec Drizzle ORM
- **Authentification** : Sessions avec bcrypt
- **Stockage local** : IndexedDB pour la résilience

## Conformité réglementaire

L'application respecte les exigences françaises pour la vente de feux d'artifice :
- Enregistrement obligatoire des informations vendeur
- Vérification de l'identité de l'acheteur
- Classification des produits (F2/F3)
- Traçabilité complète des ventes
- Export des données pour les autorités

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'administrateur système.