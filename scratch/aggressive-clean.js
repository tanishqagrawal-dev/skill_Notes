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
    'js/dashboard.js?v=6.0',
    'js/auth.js?v=6.0',
    'js/navbar.js?v=6.0',
    'js/footer.js?v=6.0',
    'js/routing.js?v=6.0',
    'js/main.js?v=6.0'
];

jsFiles.forEach(file => {
    if (fs.existsSync(file)) cleanFile(file);
});
