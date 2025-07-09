-- Script de configuration PostgreSQL pour RegisFlow
-- Exécuter sur votre serveur PostgreSQL externe

-- Se connecter en tant que superutilisateur postgres :
-- sudo -u postgres psql

-- 1. Créer l'utilisateur RegisFlow
CREATE USER regisflow WITH PASSWORD 'RegisFlow2024!';

-- 2. Créer la base de données RegisFlow
CREATE DATABASE regisflow OWNER regisflow;

-- 3. Donner tous les privilèges à l'utilisateur
GRANT ALL PRIVILEGES ON DATABASE regisflow TO regisflow;

-- 4. Se connecter à la base regisflow pour configurer les permissions
\c regisflow

-- 5. Donner les permissions sur le schéma public
GRANT ALL PRIVILEGES ON SCHEMA public TO regisflow;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO regisflow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO regisflow;

-- 6. Permissions par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO regisflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO regisflow;

-- 7. Vérifier la configuration
SELECT usename, usecreatedb, usesuper FROM pg_user WHERE usename = 'regisflow';
SELECT datname, datowner FROM pg_database WHERE datname = 'regisflow';

-- Configuration terminée !
-- Utilisateur: regisflow
-- Mot de passe: RegisFlow2024!
-- Base de données: regisflow