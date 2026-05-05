const fs = require('fs');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace .html in common strings/paths
    // Specifically targeting dashboard.html, index.html, auth.html, etc.
    const patterns = [
        /dashboard\.html/g,
        /index\.html/g,
        /auth\.html/g,
        /about\.html/g,
        /contact\.html/g,
        /privacy\.html/g,
        /terms\.html/g,
        /notes\.html/g,
        /login\.html/g
    ];

    let original = content;
    patterns.forEach(p => {
        content = content.replace(p, (match) => {
            return match.replace('.html', '');
        });
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Cleaned: ${filePath}`);
    } else {
        console.log(`No changes needed in: ${filePath}`);
    }
}

const jsFiles = [
    'js/dashboard.js',
    'js/auth.js',
    'js/navbar.js',
    'js/footer.js',
    'js/routing.js',
    'js/main.js'
];

jsFiles.forEach(file => {
    if (fs.existsSync(file)) cleanFile(file);
});
