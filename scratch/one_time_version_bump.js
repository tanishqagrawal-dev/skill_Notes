const fs = require('fs');
const path = require('path');

const NEW_VERSION = "6.0";
const ROOT_DIR = process.cwd();

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(file)) {
        return;
      }
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const filesToProcess = getAllFiles(ROOT_DIR);
console.log(`Found ${filesToProcess.length} files to process.`);

filesToProcess.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Comprehensive Regex:
    // Matches strings like "path/to/file.ext" or 'file.ext?v=...'
    // Extensions: js, css, png, jpg, jpeg, svg, pdf
    const regex = /((?:"|')((?!(?:https?:)?\/\/)[^"']+\.(js|css|png|jpg|jpeg|svg|pdf))(?:\?v=[^"']*)?)(?:"|')/g;
    
    const updatedContent = content.replace(regex, (match, fullMatch, filePath) => {
        const quote = fullMatch[0];
        
        // Skip external
        if (filePath.startsWith('http') || filePath.startsWith('//') || filePath.includes('://')) {
            return match;
        }

        // Skip strings with spaces or newlines (likely not paths)
        if (filePath.includes(' ') || filePath.includes('\n')) {
            return match;
        }
        
        // Skip if it looks like code (e.g. "express.js", "res.js") in non-HTML files
        if (!file.endsWith('.html') && ['express.js', 'res.js', 'req.js', 'app.js', 'server.js', 'package.js', 'fs.js', 'path.js'].includes(filePath)) {
            return match;
        }

        return `${quote}${filePath}?v=${NEW_VERSION}${quote}`;
    });
    
    if (content !== updatedContent) {
        fs.writeFileSync(file, updatedContent);
        console.log(`✅ Updated: ${path.relative(ROOT_DIR, file)}`);
    }
});

console.log(`\nDone! All asset references now use v=${NEW_VERSION}`);
