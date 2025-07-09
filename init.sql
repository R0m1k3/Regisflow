-- Script d'initialisation pour la base de données RegisFlow
-- Ce script sera exécuté automatiquement lors de la création du container PostgreSQL

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer la table des sessions (nécessaire pour express-session)
CREATE TABLE IF NOT EXISTS sessions (
    sid varchar NOT NULL COLLATE "default",
    sess json NOT NULL,
    expire timestamp(6) NOT NULL
);

-- Créer un index sur la colonne d'expiration
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions ("expire");

-- Créer la clé primaire pour la table des sessions
ALTER TABLE sessions ADD CONSTRAINT "session_pkey" PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Créer un utilisateur pour l'application (optionnel, déjà créé par les variables d'environnement)
-- Les autres tables seront créées automatiquement par Drizzle lors du démarrage de l'application