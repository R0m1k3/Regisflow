# Démarrage Rapide RegisFlow

## 🚀 Installation Ultra-Simple

RegisFlow est maintenant configuré pour une installation sans aucune configuration réseau complexe.

### Installation en 1 Minute

```bash
# Télécharger le projet
git clone [url-du-projet]
cd regisflow

# Installer immédiatement
docker-compose up -d
```

**C'est tout !** L'application est accessible sur http://localhost:5000

## ✅ Configuration Automatique

- **Mots de passe** : Pré-configurés dans le fichier `.env`
- **Base de données** : PostgreSQL configurée automatiquement
- **Réseau** : Utilise le réseau par défaut Docker (aucun conflit IP)
- **Volumes** : Gérés automatiquement par Docker
- **Migrations** : Exécutées automatiquement au démarrage

## 🎯 Accès Immédiat

- **Application** : http://localhost:5000
- **Utilisateur** : admin
- **Mot de passe** : admin123
- **PostgreSQL** : localhost:5433

## 🔧 Commandes Utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Arrêter
docker-compose down

# Statut
docker-compose ps
```

## 🛠️ Problèmes Courants

### Application ne démarre pas
```bash
# Vérifier Docker
docker --version
docker-compose --version

# Nettoyer et redémarrer
docker-compose down
docker-compose up -d
```

### Port 5000 déjà utilisé
```bash
# Changer le port dans docker-compose.yml
ports:
  - "5001:5000"  # Utiliser port 5001 au lieu de 5000
```

### Conflit PostgreSQL
```bash
# Changer le port PostgreSQL
ports:
  - "5434:5432"  # Utiliser port 5434 au lieu de 5433
```

## 🔒 Sécurité pour Production

Une fois testé, pour la production :

1. **Changer les mots de passe** dans `.env`
2. **Configurer HTTPS** si nécessaire
3. **Changer le mot de passe admin** dans l'application

## 📱 Fonctionnalités Disponibles

- Multi-utilisateur avec rôles
- Multi-magasins
- Enregistrement des ventes
- Historique complet
- Sauvegardes automatiques
- Purge automatique (19 mois)
- Export PDF/CSV
- Interface mobile

## 🎉 Prêt !

L'application RegisFlow est maintenant prête à l'emploi sans aucune configuration supplémentaire.