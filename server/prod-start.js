// Production startup script for Node.js 18 compatibility
// Fixes import.meta.dirname issues in Docker containers

const fs = require('fs');
const path = require('path');

// Fix for import.meta.dirname in Node.js 18
const distPath = path.join(__dirname, '../dist/index.js');

if (fs.existsSync(distPath)) {
  console.log('🔧 Applying Node.js 18 compatibility fixes...');
  
  let content = fs.readFileSync(distPath, 'utf8');
  
  // Replace import.meta.dirname with static path
  content = content.replace(
    /import\.meta\.dirname/g, 
    '"/app"'
  );
  
  // Replace import.meta.url references if any
  content = content.replace(
    /import\.meta\.url/g,
    '"file:///app"'
  );
  
  fs.writeFileSync(distPath, content);
  console.log('✅ Compatibility fixes applied');
} else {
  console.log('⚠️  Dist file not found, skipping compatibility fixes');
}

// Start the application
require('../dist/index.js');