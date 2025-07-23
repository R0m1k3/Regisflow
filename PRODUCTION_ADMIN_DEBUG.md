# DIAGNOSTIC - Problème liste utilisateurs en production

## 🚨 Problème signalé
La liste des utilisateurs n'apparaît plus dans l'administration en production.

## ✅ État en développement
- API `/api/admin/users` fonctionne correctement
- Retourne 5 utilisateurs : admin, gael, FFNANCY, ff292, ff579
- Interface d'administration accessible

## 🔍 Diagnostic production

### 1. Vérifier l'utilisateur admin
```bash
docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -c "
SELECT 'ADMIN ACTUEL:' as info, id, username, role, store_id, is_active 
FROM users WHERE username IN ('gael', 'admin') ORDER BY id;
"
```

### 2. Tester l'authentification
```bash
# Test de connexion
curl -X POST http://votre-domaine:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"gael","password":"votre_mot_de_passe"}' \
  -c /tmp/prod_admin.txt

# Vérifier les infos utilisateur
curl http://votre-domaine:5000/api/auth/me \
  -b /tmp/prod_admin.txt
```

### 3. Tester la route admin
```bash
# Test route utilisateurs admin
curl http://votre-domaine:5000/api/admin/users \
  -b /tmp/prod_admin.txt

# Réponse attendue : JSON array avec les utilisateurs
# Erreur possible : {"error":"Insufficient permissions"}
```

### 4. Vérifier les logs d'application
```bash
docker logs regisflow-regisflow-1 --tail 50 | grep -E "(admin|users|403|500)"
```

## 🔧 Solutions possibles

### Solution 1: Problème de permissions utilisateur
```sql
-- Si l'utilisateur gael n'a pas les bons droits
UPDATE users SET role = 'administrator', store_id = NULL WHERE username = 'gael';
```

### Solution 2: Session expirée ou corrompue
```bash
# Redémarrer l'application pour nettoyer les sessions
docker restart regisflow-regisflow-1
```

### Solution 3: Problème de route middleware
- Vérifier que la route `/api/admin/users` utilise `requireRole(['administrator'])`
- S'assurer que `gael` a bien le rôle `administrator` (pas `admin`)

### Solution 4: Frontend cache/build
```bash
# En cas de problème de cache frontend
docker exec regisflow-regisflow-1 rm -rf /app/dist
docker restart regisflow-regisflow-1
```

## 📊 État attendu après correction

### Base de données
```sql
-- Utilisateur gael doit avoir :
id | username | role          | store_id | is_active
3  | gael     | administrator | NULL     | true
```

### API Response
```json
[
  {
    "id": 3,
    "username": "gael", 
    "role": "administrator",
    "storeId": null,
    "isActive": true,
    ...
  },
  ...
]
```

### Interface
- Liste des utilisateurs visible dans l'onglet Administration
- Possibilité de créer/modifier/supprimer des utilisateurs
- Accès aux autres onglets (Magasins, Sauvegarde, Purge)

## 🚀 Commande de correction complète
```bash
# Correction en une seule commande
docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -c "
UPDATE users SET role = 'administrator', store_id = NULL WHERE username = 'gael';
SELECT 'UTILISATEUR CORRIGÉ:' as status, id, username, role, store_id FROM users WHERE username = 'gael';
" && docker restart regisflow-regisflow-1
```