#!/bin/bash

echo "🔧 CORRECTION PRODUCTION - Problème sélecteur magasin"
echo "=================================================="

# Commande pour corriger l'utilisateur admin en production
echo ""
echo "1. Corriger l'utilisateur admin (ID 3 - gael) :"
echo "docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -c \"UPDATE users SET role = 'administrator', store_id = NULL WHERE id = 3;\""

echo ""
echo "2. Vérifier la correction :"
echo "docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -c \"SELECT id, username, role, store_id FROM users WHERE id = 3;\""

echo ""
echo "3. Redémarrer l'application :"
echo "docker restart regisflow-regisflow-1"

echo ""
echo "4. Test API après correction :"
echo "curl -X POST http://votre-domaine:5000/api/auth/login -H \"Content-Type: application/json\" -d '{\"username\":\"gael\",\"password\":\"mot_de_passe\"}''"

echo ""
echo "RÉSULTAT ATTENDU : L'admin verra tous les magasins et pourra filtrer les ventes correctement."