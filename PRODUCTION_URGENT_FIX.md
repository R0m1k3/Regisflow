# CORRECTION URGENTE PRODUCTION - PROBLÈME SÉLECTEUR MAGASIN

## Problème identifié
- Ventes créées sur Houdemont (ID 2) mais affichées sur Frouard (ID 1)
- L'admin en production (ID 3, "gael") n'a pas accès aux bons magasins
- Sélecteur de magasin ne fonctionne pas correctement

## Solutions immédiates

### 1. Corriger l'utilisateur admin production
```sql
-- Mettre à jour l'utilisateur gael (ID 3) pour qu'il ait les bons droits
UPDATE users SET role = 'administrator', store_id = NULL WHERE id = 3;
```

### 2. Vérifier et corriger les permissions
```bash
# Connexion à la base de production
docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow
```

### 3. Commandes SQL directes
```sql
-- 1. Vérifier l'utilisateur problématique
SELECT id, username, role, store_id FROM users WHERE id = 3;

-- 2. Corriger les droits admin
UPDATE users SET role = 'administrator', store_id = NULL WHERE id = 3 AND username = 'gael';

-- 3. Vérifier tous les magasins
SELECT * FROM stores ORDER BY id;

-- 4. Vérifier les ventes par magasin
SELECT store_id, COUNT(*) as total FROM sales GROUP BY store_id;
```

## Résultats attendus
Après correction, l'admin devrait voir tous les magasins et pouvoir filtrer les ventes correctement.