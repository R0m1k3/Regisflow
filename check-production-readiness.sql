-- Script de vérification de la cohérence de la base de données pour la production

-- 1. Vérifier les tables existantes
\dt

-- 2. Vérifier l'intégrité des données sales
SELECT 
  'Sales integrity check' as check_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN vendeur IS NULL OR vendeur = '' THEN 1 END) as missing_vendeur,
  COUNT(CASE WHEN nom IS NULL OR nom = '' THEN 1 END) as missing_nom,
  COUNT(CASE WHEN prenom IS NULL OR prenom = '' THEN 1 END) as missing_prenom,
  COUNT(CASE WHEN date_naissance IS NULL OR date_naissance = '' THEN 1 END) as missing_date_naissance
FROM sales;

-- 3. Vérifier les produits
SELECT 
  'Products integrity check' as check_type,
  COUNT(*) as total_products,
  COUNT(CASE WHEN type_article IS NULL OR type_article = '' THEN 1 END) as missing_type_article,
  COUNT(CASE WHEN categorie IS NULL OR categorie = '' THEN 1 END) as missing_categorie,
  COUNT(CASE WHEN quantite IS NULL OR quantite <= 0 THEN 1 END) as invalid_quantite
FROM sale_products;

-- 4. Vérifier les relations
SELECT 
  'Relations check' as check_type,
  COUNT(s.id) as sales_count,
  COUNT(sp.id) as products_count,
  COUNT(CASE WHEN sp.sale_id IS NULL THEN 1 END) as orphaned_products
FROM sales s
LEFT JOIN sale_products sp ON s.id = sp.sale_id;

-- 5. Vérifier les utilisateurs
SELECT 
  'Users check' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_count,
  COUNT(CASE WHEN role = 'employee' THEN 1 END) as employee_count
FROM users;

-- 6. Vérifier les magasins
SELECT 
  'Stores check' as check_type,
  COUNT(*) as total_stores,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_stores
FROM stores;

-- 7. Vérifier les photos
SELECT 
  'Photos check' as check_type,
  COUNT(*) as total_sales,
  COUNT(CASE WHEN photo_recto IS NOT NULL THEN 1 END) as has_recto,
  COUNT(CASE WHEN photo_verso IS NOT NULL THEN 1 END) as has_verso,
  COUNT(CASE WHEN photo_ticket IS NOT NULL THEN 1 END) as has_ticket,
  AVG(LENGTH(photo_recto)) as avg_recto_size,
  AVG(LENGTH(photo_verso)) as avg_verso_size,
  AVG(LENGTH(photo_ticket)) as avg_ticket_size
FROM sales;

-- 8. Vérifier les sessions (optionnel - nettoyer les anciennes)
SELECT 
  'Sessions check' as check_type,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN expire < NOW() THEN 1 END) as expired_sessions
FROM sessions;