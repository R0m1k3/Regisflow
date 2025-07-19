# CORRECTION URGENTE PRODUCTION - PROBLÈME SÉLECTEUR MAGASIN

## ✅ PROBLÈME IDENTIFIÉ ET RÉSOLU

### Problème principal
- Ventes créées sur le mauvais magasin malgré le sélecteur de magasin
- Frontend utilisait `user?.role === 'admin'` au lieu de `'administrator'`
- Le `storeId` n'était pas envoyé dans les requêtes de création de vente

### ✅ CORRECTIONS APPLIQUÉES

#### 1. Frontend corrigé
```javascript
// ✅ AVANT (incorrect)
...(user?.role === 'admin' && selectedStoreId && { storeId: selectedStoreId })

// ✅ APRÈS (correct)
...(user?.role === 'administrator' && selectedStoreId && { storeId: selectedStoreId })
```

#### 2. Backend corrigé
```javascript
// ✅ Routes API corrigées pour utiliser 'administrator' au lieu de 'admin'
if (user.role !== 'administrator' && targetStoreId !== user.storeId)
if (user.role === 'administrator' && req.body.storeId)
```

### Solutions pour production

#### 1. Corriger l'utilisateur admin production
```sql
-- Mettre à jour l'utilisateur gael (ID 3) pour qu'il ait les bons droits
UPDATE users SET role = 'administrator', store_id = NULL WHERE id = 3;
```

#### 2. Redémarrer l'application
```bash
docker restart regisflow-regisflow-1
```

#### 3. Test après correction
Les ventes devraient maintenant être créées sur le bon magasin sélectionné.

## ✅ RÉSULTATS ATTENDUS
- L'admin peut voir et sélectionner tous les magasins
- Les ventes sont créées sur le magasin sélectionné
- L'historique affiche les ventes du bon magasin