# Configuration Réseau Docker - RegisFlow

## 🌐 Problématique des Conflits Réseau

Le sous-réseau `172.20.0.0/24` peut créer des conflits avec des réseaux existants sur certains systèmes. Pour éviter ces problèmes, RegisFlow propose plusieurs configurations.

## 🔧 Options de Configuration

### Option 1 : Installation Simple (Recommandée)

**Fichier** : `docker-compose.simple.yml`

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
- Idéal pour tests et développement

**Utilisation** :
```bash
docker-compose -f docker-compose.simple.yml up -d
```

### Option 2 : Configuration Sécurisée

**Fichier** : `docker-compose.yml`

```yaml
# Réseau personnalisé avec sous-réseau dédié
networks:
  regisflow-internal:
    driver: bridge
    internal: false
    ipam:
      driver: default
      config:
        - subnet: 192.168.200.0/24
          ip_range: 192.168.200.0/28
          gateway: 192.168.200.1
```

**Avantages** :
- Isolement réseau complet
- Contrôle total des adresses IP
- Sécurité renforcée
- Idéal pour production

**Utilisation** :
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option 3 : Configuration Personnalisée

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

### Pour Tests/Développement :
- Utilisez `docker-compose.simple.yml`
- Aucune configuration réseau nécessaire
- Démarrage rapide

### Pour Production :
- Utilisez `docker-compose.yml` 
- Vérifiez les conflits avant déploiement
- Personnalisez le sous-réseau si nécessaire

## 📚 Scripts Inclus

- `install-simple.sh` - Utilise la configuration simple
- `deploy-prod.sh` - Utilise la configuration sécurisée
- `monitoring.sh` - Surveille tous les types de réseaux

## 🔒 Sécurité

Les deux configurations sont sécurisées :
- Communications chiffrées entre conteneurs
- Isolation des services
- Accès contrôlé aux ports