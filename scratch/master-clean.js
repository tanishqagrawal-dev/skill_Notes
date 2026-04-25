const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        let fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.agent' && file !== 'dist') {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            const ext = path.extname(file);
            if (ext === '.js' || ext === '.html') {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function cleanFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;

        // 1. href and src
        content = content.replace(/href\s*=\s*["']([^"']+)\.html(["'])/g, 'href="$1$2');
        content = content.replace(/src\s*=\s*["']([^"']+)\.html(["'])/g, 'src="$1$2');
        
        // 2. location assignments
        content = content.replace(/(location\.href|location|window\.location\.href)\s*=\s*["']([^"']+)\.html(["'])/g, '$1 = "$2$3"');
        
        // 3. JS path checks
        content = content.replace(/\.endsWith\(['"]([^'"]+)\.html['"]\)/g, ".endsWith('$1')");
        content = content.replace(/\.includes\(['"]([^'"]+)\.html['"]\)/g, ".includes('$1')");
        
        // 4. Any string ending in .html within quotes
        // Avoid replacing .html filenames in comments or non-path strings if possible, 
        // but for this task we want to be thorough.
        // We'll specifically look for [path].html
        content = content.replace(/['"]([^'"\s]*\/?[^'"\s\/]+)\.html(['"])/g, "'$1$2");

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`Cleaned: ${filePath}`);
            return true;
        }
    } catch (e) {
        console.error(`Error processing ${filePath}: ${e.message}`);
    }
    return false;
}

const allFiles = getAllFiles('.');
let totalCleaned = 0;
allFiles.forEach(file => {
    if (cleanFile(file)) totalCleaned++;
});

console.log(`Finished. Total files modified: ${totalCleaned}`);
