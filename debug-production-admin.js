// Script de debug pour forcer la correction admin en production
const fs = require('fs');
const path = require('path');

// Simuler la correction directement dans le code pour production
const fixProductionAdmin = () => {
  console.log('=== DEBUG ADMIN PRODUCTION ===');
  console.log('Problème identifié:');
  console.log('- Logs montrent: ID 3, email tronqué "admin@exampl"');  
  console.log('- Utilisateur connecté différent entre dev (ID 1) et prod (ID 3)');
  console.log('');
  
  console.log('SOLUTIONS à appliquer:');
  console.log('1. Corriger base de données production:');
  console.log('   UPDATE users SET role = \'administrator\' WHERE id = 3;');
  console.log('');
  console.log('2. Ou créer utilisateur admin correct:');
  console.log('   INSERT INTO users (username, password, email, role, store_id) VALUES');
  console.log('   (\'admin\', \'$2b$12$hashed_password\', \'admin@example.com\', \'administrator\', NULL);');
  console.log('');
  
  console.log('3. Vérifier les sessions:');
  console.log('   DELETE FROM sessions WHERE data LIKE \'%"id":3%\';');
};

if (require.main === module) {
  fixProductionAdmin();
}

module.exports = fixProductionAdmin;