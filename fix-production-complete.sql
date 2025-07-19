-- CORRECTION COMPLÈTE PRODUCTION - Tous les problèmes identifiés
-- Exécuter ces commandes dans la base de données production

-- 1. Corriger l'utilisateur admin (ID 3) - permissions complètes
UPDATE users 
SET role = 'administrator', store_id = NULL 
WHERE id = 3 AND username = 'gael';

-- 2. Vérifier que la correction a bien été appliquée
SELECT 'UTILISATEUR ADMIN CORRIGÉ:' as status, 
       id, username, role, store_id 
FROM users 
WHERE id = 3;

-- 3. Vérifier tous les magasins disponibles
SELECT 'MAGASINS DISPONIBLES:' as info, 
       id, name, is_active 
FROM stores 
ORDER BY id;

-- 4. Vérifier la répartition des ventes par magasin
SELECT 'RÉPARTITION DES VENTES:' as info, 
       store_id, 
       COUNT(*) as total_ventes,
       MAX(timestamp) as derniere_vente
FROM sales 
GROUP BY store_id 
ORDER BY store_id;

-- 5. Test de permissions (à exécuter après redémarrage de l'application)
-- curl -X POST http://votre-domaine:5000/api/auth/login \
--   -H "Content-Type: application/json" \
--   -d '{"username":"gael","password":"votre_mot_de_passe"}'
-- 
-- curl http://votre-domaine:5000/api/stores -H "Cookie: session_cookie"
-- (Devrait retourner tous les magasins)
--
-- curl http://votre-domaine:5000/api/sales?storeId=2 -H "Cookie: session_cookie"  
-- (Devrait retourner les ventes du magasin Houdemont)

-- RÉSULTATS ATTENDUS APRÈS APPLICATION :
-- ✅ Magasins : Admin voit Frouard ET Houdemont dans le sélecteur
-- ✅ Création : Ventes créées sur le magasin sélectionné (pas toujours Frouard)
-- ✅ Historique : Affichage des ventes du magasin sélectionné
-- ✅ Suppression : Les ventes peuvent être supprimées par l'admin