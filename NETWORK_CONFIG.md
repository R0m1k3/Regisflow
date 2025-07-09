# Configuration Réseau Docker - RegisFlow

## 🌐 Problématique des Conflits Réseau

Le sous-réseau `172.20.0.0/24` peut créer des conflits avec des réseaux existants sur certains systèmes. Pour éviter ces problèmes, RegisFlow propose plusieurs configurations.

## 🔧 Configuration Simplifiée

### Configuration Unique

**Fichier** : `docker-compose.yml`

```yaml
# Utilise le réseau par défaut de Docker
networks:
  default:
    driver: bridge
```

**Avantages** :
- Aucun conflit de sous-réseau
- Docker gère automatiquement les adresses IP
- Configuration la plus simple
- Compatible avec tous les environnements

**Utilisation** :
```bash
docker-compose up -d
```

### Configuration Personnalisée (Si Nécessaire)

Si vous avez des exigences spécifiques, modifiez le sous-réseau :

```yaml
networks:
  regisflow-internal:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 10.100.0.0/24  # Votre sous-réseau
```

## 📋 Sous-réseaux Recommandés

### Évitez ces plages (souvent utilisées) :
- `172.16.0.0/12` - Réseaux privés Docker
- `192.168.1.0/24` - Réseaux domestiques
- `10.0.0.0/8` - Réseaux d'entreprise

### Utilisez ces plages (plus sûres) :
- `192.168.200.0/24` - Peu utilisé
- `172.30.0.0/24` - Rarement en conflit
- `10.100.0.0/24` - Espace libre

## 🔍 Vérifier les Conflits

```bash
# Voir les réseaux Docker existants
docker network ls

# Voir les détails d'un réseau
docker network inspect bridge

# Voir les routes système
ip route show

# Vérifier les interfaces réseau
ip addr show
```

## 🛠️ Résolution des Conflits

### Si vous avez un conflit :

1. **Identifier le conflit** :
   ```bash
   docker network inspect regisflow_regisflow-internal
   ```

2. **Changer le sous-réseau** :
   ```bash
   # Arrêter les services
   docker-compose down
   
   # Supprimer le réseau
   docker network rm regisflow_regisflow-internal
   
   # Modifier docker-compose.yml avec un nouveau sous-réseau
   # Puis redémarrer
   docker-compose up -d
   ```

3. **Ou utiliser la configuration simple** :
   ```bash
   docker-compose -f docker-compose.simple.yml up -d
   ```

## 🎯 Recommandations

### Pour tous les environnements :
- Utilisez `docker-compose.yml`
- Aucune configuration réseau nécessaire
- Démarrage rapide et compatible

### Si vous avez des besoins spécifiques :
- Modifiez le fichier `docker-compose.yml`
- Ajoutez une configuration réseau personnalisée
- Testez avant déploiement

## 📚 Scripts Inclus

- `install-simple.sh` - Installation automatique
- `deploy-prod.sh` - Déploiement production
- `monitoring.sh` - Surveillance des services

## 🔒 Sécurité

La configuration est sécurisée :
- Communications chiffrées entre conteneurs
- Isolation des services
- Accès contrôlé aux ports
- Réseau Docker par défaut isolé du réseau hôte