#!/usr/bin/env node

// Polyfill pour import.meta.dirname dans Node.js 18
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Obtenir le répertoire courant
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Lire le fichier dist/index.js et remplacer import.meta.dirname
const distPath = path.join(projectRoot, 'dist', 'index.js');
let distContent = fs.readFileSync(distPath, 'utf-8');

// Remplacer toutes les instances de import.meta.dirname par une valeur statique
const replacement = `"${projectRoot.replace(/\\/g, '\\\\')}"`;
distContent = distContent.replace(/import\.meta\.dirname/g, replacement);

// Aussi corriger les chemins pour le serveur statique
distContent = distContent.replace(/path3\.resolve\(\s*import\.meta\.dirname,\s*"public"\s*\)/g, 
  `path3.resolve("${projectRoot.replace(/\\/g, '\\\\')}", "public")`);

// Écrire le fichier modifié
fs.writeFileSync(distPath, distContent);

console.log('✅ Node.js 18 compatibility fix applied');

// Démarrer l'application
import('../dist/index.js').catch(console.error);