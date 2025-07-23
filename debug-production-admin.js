#!/usr/bin/env node

/**
 * Script de diagnostic pour problème administration production
 * Teste les routes d'administration et permissions
 */

const https = require('https');
const http = require('http');

// Configuration production - remplacez par votre domaine
const PROD_URL = 'your-production-domain.com';
const PROD_PORT = 5000;

// Test des routes d'administration
async function testAdminRoutes() {
  console.log('🔍 DIAGNOSTIC ADMINISTRATION PRODUCTION');
  console.log('=====================================');
  
  // 1. Test de connexion auth
  console.log('\n1. Test connexion administrateur...');
  try {
    const loginData = {
      username: 'gael', // ou l'utilisateur admin en production
      password: 'your_password' // Remplacez par le bon mot de passe
    };
    
    console.log('POST /api/auth/login');
    console.log('- Username:', loginData.username);
    console.log('- Vérifiez le mot de passe manuellement');
    
  } catch (error) {
    console.error('❌ Erreur login:', error.message);
  }
  
  // 2. Test route /api/admin/users
  console.log('\n2. Test route admin users...');
  console.log('GET /api/admin/users');
  console.log('- Route nécessite role: administrator');
  console.log('- Utilisateur gael doit avoir store_id = NULL');
  
  // 3. Test route /api/auth/me
  console.log('\n3. Test informations utilisateur...');
  console.log('GET /api/auth/me');
  console.log('- Doit retourner role: administrator');
  console.log('- Doit retourner storeId: null');
  
  console.log('\n📋 COMMANDES DE DIAGNOSTIC PRODUCTION:');
  console.log('=====================================');
  
  console.log('\n# 1. Vérifier l\'état de l\'utilisateur admin:');
  console.log('docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -c "SELECT id, username, role, store_id FROM users WHERE username = \'gael\';"');
  
  console.log('\n# 2. Tester la route d\'administration:');
  console.log('curl -X POST http://votre-domaine:5000/api/auth/login \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"username":"gael","password":"votre_mot_de_passe"}\' \\');
  console.log('  -c /tmp/admin_test.txt');
  
  console.log('\ncurl http://votre-domaine:5000/api/admin/users \\');
  console.log('  -b /tmp/admin_test.txt');
  
  console.log('\n# 3. Vérifier les logs de l\'application:');
  console.log('docker logs regisflow-regisflow-1 --tail 50');
  
  console.log('\n# 4. Si problème de permissions, corriger:');
  console.log('docker exec regisflow-regisflow-1 psql -U regisflow -d regisflow -c "UPDATE users SET role = \'administrator\', store_id = NULL WHERE username = \'gael\';"');
  console.log('docker restart regisflow-regisflow-1');
  
  console.log('\n✅ RÉSULTATS ATTENDUS:');
  console.log('- /api/admin/users retourne un tableau JSON des utilisateurs');
  console.log('- Interface d\'administration affiche la liste');
  console.log('- Pas d\'erreur "Insufficient permissions"');
}

// Exécuter le diagnostic
testAdminRoutes().catch(console.error);