-- Migration pour les ventes multi-produits
-- Cette migration convertit les ventes existantes vers le nouveau système

-- 1. Créer la nouvelle table sale_products
CREATE TABLE IF NOT EXISTS sale_products (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
    type_article VARCHAR(255) NOT NULL,
    categorie VARCHAR(2) NOT NULL,
    quantite INTEGER NOT NULL,
    gencode VARCHAR(13) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrer les données existantes des ventes vers sale_products
INSERT INTO sale_products (sale_id, type_article, categorie, quantite, gencode)
SELECT 
    id,
    type_article,
    categorie,
    quantite,
    gencode
FROM sales
WHERE type_article IS NOT NULL;

-- 3. Supprimer les colonnes produit de la table sales (après migration réussie)
-- Ces commandes seront exécutées après validation de la migration
-- ALTER TABLE sales DROP COLUMN type_article;
-- ALTER TABLE sales DROP COLUMN categorie;
-- ALTER TABLE sales DROP COLUMN quantite;
-- ALTER TABLE sales DROP COLUMN gencode;

-- 4. Créer les index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_sale_products_sale_id ON sale_products(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_products_gencode ON sale_products(gencode);

-- 5. Ajouter les contraintes
ALTER TABLE sale_products ADD CONSTRAINT chk_sale_products_categorie 
    CHECK (categorie IN ('F2', 'F3'));

-- 6. Mettre à jour les séquences
SELECT setval('sale_products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sale_products));