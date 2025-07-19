-- Script de vérification pour RegisFlow Production
-- À exécuter pour valider que la base de données est prête

-- Vérifier la version PostgreSQL
SELECT version();

-- Vérifier les tables principales
\dt

-- Compter les utilisateurs
SELECT COUNT(*) as total_users FROM users;

-- Compter les magasins
SELECT COUNT(*) as total_stores FROM stores;

-- Compter les ventes
SELECT COUNT(*) as total_sales FROM sales;

-- Vérifier l'utilisateur admin par défaut
SELECT username, role, email FROM users WHERE role = 'admin';

-- Vérifier les index pour performance
\di

-- Taille de la base de données
SELECT pg_size_pretty(pg_database_size('regisflow')) as database_size;

-- Dernières ventes (si des données existent)
SELECT id, vendeur, nom, prenom, created_at 
FROM sales 
ORDER BY created_at DESC 
LIMIT 5;

-- Vérifier les sessions actives
SELECT COUNT(*) as active_sessions FROM sessions;

-- Status général
SELECT 
  'RegisFlow Production Check' as status,
  CURRENT_TIMESTAMP as check_time,
  current_database() as database_name,
  current_user as database_user;