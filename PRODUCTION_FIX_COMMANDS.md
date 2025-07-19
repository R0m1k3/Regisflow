# CORRECTION URGENTE ADMIN PRODUCTION

## Problème identifié
- En production: Utilisateur admin ID 3 avec rôle "admin" au lieu de "administrator"
- Logs montrent: `{"id":3,"username":"admin","email":"admin@exampl...`

## Solutions appliquées

### 1. Correction automatique (déjà ajoutée au code)
Le fichier `server/storage.ts` contient maintenant une correction automatique qui se déclenche au démarrage.

### 2. Correction manuelle SQL (si nécessaire)

**Commande Docker pour production:**
```bash
docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -f /app/force-admin-correction.sql
```

**Ou commande SQL directe:**
```bash
docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -c "UPDATE users SET role = 'administrator' WHERE username = 'admin';"
```

### 3. Vérification
```bash
docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -c "SELECT id, username, role FROM users WHERE username = 'admin';"
```

## Résultats attendus
Après correction, l'onglet "Administration" apparaîtra dans l'interface utilisateur.

## Si le problème persiste
1. Redémarrer le container: `docker restart regisflow-regisflow-1`
2. Vider le cache navigateur
3. Se reconnecter avec admin/admin123