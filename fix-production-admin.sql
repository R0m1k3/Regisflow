-- Script pour corriger le rôle admin en production
-- Ce script doit être exécuté sur la base de données de production

-- Vérifier tous les utilisateurs admin
SELECT id, username, role, email FROM users WHERE username = 'admin';

-- Mettre à jour tous les utilisateurs admin vers le rôle 'administrator'
UPDATE users SET role = 'administrator' WHERE username = 'admin' AND role = 'admin';

-- Vérifier que la mise à jour a fonctionné
SELECT id, username, role, email FROM users WHERE username = 'admin';

-- Vérifier que les routes admin fonctionnent (permissions)
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as admin_users FROM users WHERE role = 'administrator';