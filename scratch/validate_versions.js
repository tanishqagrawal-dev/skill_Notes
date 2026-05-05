const fs = require('fs');
const path = require('path');

const REQUIRED_VERSION = "6.0";
const ROOT_DIR = process.cwd();

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.html') || file.endsWith('.js')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const filesToProcess = getAllFiles(ROOT_DIR);
let missingCount = 0;

filesToProcess.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Simple regex to find all potential local JS/CSS references
    const regex = /("?|'?)((?!https?:|\/\/)[^"' ]+\.(js|css))(\?v=[^"']*)?(\1)/g;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
        const fullMatch = match[0];
        const filePath = match[2];
        const currentVersion = match[4];
        
        if (!currentVersion || !currentVersion.includes(REQUIRED_VERSION)) {
            console.log(`⚠️ Missing or wrong version: ${path.relative(ROOT_DIR, file)} -> ${filePath} (found: ${currentVersion || 'none'})`);
            missingCount++;
        }
    }
});

if (missingCount === 0) {
    console.log(`\n✅ ALL local JS/CSS references are correctly versioned with v=${REQUIRED_VERSION}`);
} else {
    console.log(`\n❌ Found ${missingCount} references with missing or wrong versions.`);
}
