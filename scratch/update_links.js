const fs = require('fs');
const glob = require('glob');

function processFiles(pattern) {
    const files = glob.sync(pattern);
    files.forEach(f => {
        let c = fs.readFileSync(f, 'utf8');
        let original = c;
        
        // replace inner hrefs and locations directly
        c = c.replace(/href=\"([a-zA-Z0-9_\-\/]+)\.html([^\"]*)\"/g, 'href=\"$1$2\"');
        c = c.replace(/href=\'([a-zA-Z0-9_\-\/]+)\.html([^\']*)\'/g, 'href=\'$1$2\'');
        
        c = c.replace(/location\.href\s*=\s*'([a-zA-Z0-9_\-\/]+)\.html([^']*)'/g, 'location.href=\'$1$2\'');
        c = c.replace(/location\.href\s*=\s*\"([a-zA-Z0-9_\-\/]+)\.html([^\"]*)\"/g, 'location.href=\"$1$2\"');

        if (c !== original) {
            console.log("Updated", f);
            fs.writeFileSync(f, c);
        }
    });
}

processFiles('pages/**/*');
processFiles('js/**/*.js');
processFiles('dist/**/*');
