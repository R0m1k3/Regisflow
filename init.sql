-- Script d'initialisation PostgreSQL pour RegisFlow
-- Ce script crée toutes les tables nécessaires et les données de base

-- Configuration initiale
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Création de la base de données (si elle n'existe pas déjà)
-- CREATE DATABASE regisflow WITH ENCODING 'UTF8' LC_COLLATE='fr_FR.UTF-8' LC_CTYPE='fr_FR.UTF-8';

-- Extension pour les UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des sessions (pour l'authentification)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Index sur la date d'expiration des sessions
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- Table des magasins
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs avec authentification
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'employee',
    store_id INTEGER REFERENCES stores(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des ventes
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Informations vendeur
    vendeur VARCHAR(255) NOT NULL,
    
    -- Informations produit
    type_article VARCHAR(255) NOT NULL,
    categorie VARCHAR(2) NOT NULL,
    quantite INTEGER NOT NULL,
    gencode VARCHAR(13) NOT NULL,
    
    -- Informations client
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    date_naissance VARCHAR(10) NOT NULL,
    lieu_naissance VARCHAR(255),
    mode_paiement VARCHAR(50) NOT NULL DEFAULT 'Espèce',
    
    -- Informations pièce d'identité
    type_identite VARCHAR(100) NOT NULL,
    numero_identite VARCHAR(100) NOT NULL,
    autorite_delivrance VARCHAR(255),
    date_delivrance VARCHAR(10) NOT NULL,
    
    -- Photos (Base64)
    photo_recto TEXT,
    photo_verso TEXT,
    photo_ticket TEXT
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_nom ON sales(nom);
CREATE INDEX IF NOT EXISTS idx_sales_prenom ON sales(prenom);
CREATE INDEX IF NOT EXISTS idx_sales_gencode ON sales(gencode);

-- Relations et contraintes
ALTER TABLE users ADD CONSTRAINT chk_user_role 
    CHECK (role IN ('admin', 'manager', 'employee'));

ALTER TABLE sales ADD CONSTRAINT chk_sales_categorie 
    CHECK (categorie IN ('F2', 'F3'));

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des données de base

-- Magasin par défaut
INSERT INTO stores (id, name, address, phone, email) 
VALUES (1, 'Magasin Principal', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Utilisateur administrateur par défaut
-- Mot de passe: admin123 (hashé avec bcrypt)
INSERT INTO users (id, username, password, email, first_name, last_name, role, store_id)
VALUES (1, 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@regisflow.com', 'Admin', 'RegisFlow', 'admin', 1)
ON CONFLICT (username) DO NOTHING;

-- Séquences pour l'auto-increment
SELECT setval('stores_id_seq', (SELECT COALESCE(MAX(id), 1) FROM stores));
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('sales_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sales));

-- Permissions et sécurité
GRANT CONNECT ON DATABASE regisflow TO regisflow;
GRANT USAGE ON SCHEMA public TO regisflow;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO regisflow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO regisflow;

-- Vue pour les statistiques (optionnelle)
CREATE OR REPLACE VIEW sales_stats AS
SELECT 
    s.store_id,
    st.name as store_name,
    COUNT(*) as total_sales,
    DATE_TRUNC('month', s.timestamp) as month_year,
    s.categorie,
    COUNT(*) as category_count
FROM sales s
LEFT JOIN stores st ON s.store_id = st.id
GROUP BY s.store_id, st.name, DATE_TRUNC('month', s.timestamp), s.categorie
ORDER BY month_year DESC;

-- Commentaires pour la documentation
COMMENT ON TABLE sessions IS 'Table des sessions utilisateur pour l''authentification';
COMMENT ON TABLE stores IS 'Table des magasins/points de vente';
COMMENT ON TABLE users IS 'Table des utilisateurs avec rôles et authentification';
COMMENT ON TABLE sales IS 'Table principale des ventes de feux d''artifice';
COMMENT ON COLUMN sales.categorie IS 'Catégorie F2 ou F3 selon la réglementation française';
COMMENT ON COLUMN sales.photo_recto IS 'Photo recto de la pièce d''identité (Base64)';
COMMENT ON COLUMN sales.photo_verso IS 'Photo verso de la pièce d''identité (Base64)';
COMMENT ON COLUMN sales.photo_ticket IS 'Photo du ticket de caisse (Base64)';

-- Affichage des informations de fin
\echo 'Base de données RegisFlow initialisée avec succès!'
\echo 'Utilisateur admin créé: username=admin, password=admin123'
\echo 'Magasin par défaut créé: Magasin Principal'