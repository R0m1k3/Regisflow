-- CORRECTION URGENTE ADMIN PRODUCTION
-- Exécuter sur la base de production

-- 1. Vérifier l'utilisateur problématique (ID 3 d'après les logs)
SELECT id, username, email, role, store_id FROM users WHERE id = 3;

-- 2. Corriger le rôle de l'utilisateur ID 3
UPDATE users SET role = 'administrator' WHERE id = 3 AND username = 'admin';

-- 3. Vérifier si correction appliquée
SELECT id, username, email, role, store_id FROM users WHERE id = 3;

-- 4. Nettoyer les sessions problématiques
DELETE FROM sessions WHERE data LIKE '%"id":3%' AND data NOT LIKE '%"role":"administrator"%';

-- 5. Vérifier tous les utilisateurs admin
SELECT id, username, email, role, store_id FROM users WHERE role = 'administrator';

-- 6. Forcer création admin backup si nécessaire
INSERT INTO users (username, password, email, first_name, last_name, role, store_id, is_active, created_at, updated_at) 
VALUES ('admin_backup', '$2b$12$LQv3c1yqBwuvHi44M0Bfa.5jW.5J5J5J5J5J5J5J5J5J5J5J5J5J5J', 'admin_backup@regisflow.com', 'Admin', 'Backup', 'administrator', NULL, true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;