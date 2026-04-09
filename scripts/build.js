const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const JavaScriptObfuscator = require('javascript-obfuscator');
const htmlMinifier = require('html-minifier');
const CleanCSS = require('clean-css');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

async function build() {
    console.log('Starting build process...');

    // 1. Clean previous dist folder
    if (fs.existsSync(DIST_DIR)) {
        console.log('Cleaning up old dist directory...');
        fs.removeSync(DIST_DIR);
    }
    fs.mkdirSync(DIST_DIR);

    // 2. Define exactly what should be copied to dist (the public assets)
    // We EXCLUDE backend files (like server/, functions/, node_modules/, etc.)
    const copyMatches = glob.sync('**/*', {
        cwd: ROOT_DIR,
        nodir: true,
        ignore: [
            'node_modules/**',
            'server/**',
            'functions/**',
            'scripts/**',
            'dist/**',
            '.git/**',
            '.firebase/**',
            '.*/**',           // exclude things like .qodo
            'package*.json',
            '*.md',
            '*.txt',
            'firebase.json',
            'firestore.rules',
            'storage.rules',
            '.env*',
            'Dockerfile',
            'OS unit 3.pdf'
        ]
    });

    console.log(`Copying ${copyMatches.length} files to dist...`);
    for (const file of copyMatches) {
        const srcPath = path.join(ROOT_DIR, file);
        const destPath = path.join(DIST_DIR, file);
        fs.ensureDirSync(path.dirname(destPath));
        fs.copyFileSync(srcPath, destPath);
    }

    // 3. Process the files in the dist folder
    const distFiles = glob.sync('**/*', { cwd: DIST_DIR, nodir: true });

    for (const file of distFiles) {
        const absolutePath = path.join(DIST_DIR, file);
        const ext = path.extname(file).toLowerCase();

        if (ext === '.js') {
            // OBFUSCATE AND MINIFY JAVASCRIPT
            console.log(`Obfuscating JS: ${file}`);
            const code = fs.readFileSync(absolutePath, 'utf8');
            try {
                const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
                    compact: true,
                    controlFlowFlattening: true,
                    controlFlowFlatteningThreshold: 0.75,
                    deadCodeInjection: true,
                    deadCodeInjectionThreshold: 0.4,
                    debugProtection: false,     // Keep false to avoid breaking the app unnecessarily, set true to prevent developer tools completely
                    disableConsoleOutput: true, // Strips console.logs
                    identifierNamesGenerator: 'hexadecimal',
                    log: false,
                    numbersToExpressions: true,
                    renameGlobals: false,
                    selfDefending: true,       // Makes it harder to format and modify
                    simplify: true,
                    splitStrings: true,
                    splitStringsChunkLength: 10,
                    stringArray: true,
                    stringArrayEncoding: ['base64'],
                    stringArrayThreshold: 0.75,
                    transformObjectKeys: true,
                    unicodeEscapeSequence: false
                }).getObfuscatedCode();
                fs.writeFileSync(absolutePath, obfuscatedCode);
            } catch (e) {
                console.error(`Failed to obfuscate ${file}: ${e.message}`);
            }

        } else if (ext === '.html') {
            // MINIFY HTML
            console.log(`Minifying HTML: ${file}`);
            const code = fs.readFileSync(absolutePath, 'utf8');
            try {
                const minifiedCode = htmlMinifier.minify(code, {
                    collapseWhitespace: true,
                    removeComments: true,
                    minifyJS: true, // minifies inline JS
                    minifyCSS: true // minifies inline CSS
                });
                fs.writeFileSync(absolutePath, minifiedCode);
            } catch (e) {
                console.error(`Failed to minify HTML ${file}: ${e.message}`);
            }

        } else if (ext === '.css') {
            // MINIFY CSS
            console.log(`Minifying CSS: ${file}`);
            const code = fs.readFileSync(absolutePath, 'utf8');
            try {
                const minifiedCode = new CleanCSS().minify(code).styles;
                fs.writeFileSync(absolutePath, minifiedCode);
            } catch (e) {
                console.error(`Failed to minify CSS ${file}: ${e.message}`);
            }
        }
    }

    console.log('\\n======================================================');
    console.log('Build completed successfully!');
    console.log('Your code is now obfuscated and minified in the "dist" folder.');
    console.log('======================================================');
}

build().catch(err => {
    console.error('Build failed:', err);
});
