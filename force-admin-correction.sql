-- CORRECTION IMMÉDIATE ADMIN PRODUCTION
-- Basé sur les logs: l'utilisateur admin a l'ID 3 avec email tronqué

-- 1. Identifier l'utilisateur problématique
SELECT 'AVANT CORRECTION:' as status, id, username, email, role, store_id FROM users WHERE username = 'admin';

-- 2. CORRECTION FORCÉE: Mettre à jour TOUS les utilisateurs admin vers administrator
UPDATE users SET role = 'administrator' WHERE username = 'admin';

-- 3. CORRECTION SPÉCIFIQUE: Forcer l'utilisateur ID 3 (celui des logs de production)
UPDATE users SET role = 'administrator', email = 'admin@regisflow.com' WHERE id = 3;

-- 4. Vérifier la correction
SELECT 'APRÈS CORRECTION:' as status, id, username, email, role, store_id FROM users WHERE username = 'admin';

-- 5. Nettoyer les sessions avec mauvais rôle
DELETE FROM sessions WHERE data LIKE '%"id":3%' AND data NOT LIKE '%"role":"administrator"%';

-- 6. Afficher tous les administrateurs
SELECT 'TOUS LES ADMIN:' as status, id, username, email, role FROM users WHERE role = 'administrator';