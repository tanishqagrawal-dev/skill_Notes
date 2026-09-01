const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const JavaScriptObfuscator = require('javascript-obfuscator');
const htmlMinifier = require('html-minifier');
const CleanCSS = require('clean-css');
require('dotenv').config(); // Load local .env if available

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
            '**/node_modules/**',
            '**/server/**',
            '**/functions/**',
            '**/scripts/**',
            '**/dist/**',
            '**/.git/**',
            '**/.firebase/**',
            '**/.*/**',           // exclude things like .qodo
            '**/package*.json',
            '**/*.md',
            'error.log',
            '*_error.txt',
            '*_log.txt',
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

    const BUILD_VERSION = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    console.log(`🚀 Build Version generated: ${BUILD_VERSION}`);

    // 3. Process the files in the dist folder
    const distFiles = glob.sync('**/*', { cwd: DIST_DIR, nodir: true });

    for (const file of distFiles) {
        const absolutePath = path.join(DIST_DIR, file);
        const ext = path.extname(file).toLowerCase();

        if (ext === '.js') {
            // OBFUSCATE AND MINIFY JAVASCRIPT
            console.log(`Processing JS: ${file}`);
            let code = fs.readFileSync(absolutePath, 'utf8');

            // --- INJECT SECURE API KEYS ---
            if (code.includes('INJECT_')) {
                console.log(`🔐 Injecting secure API keys into ${file}...`);
                const keys = {
                    'GEMINI_API_KEY': process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.split('').reverse().join('') : '',
                    'GROQ_API_KEY': process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.split('').reverse().join('') : '',
                    'SUPABASE_URL': process.env.SUPABASE_URL || '',
                    'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY || '',
                    'FIREBASE_API_KEY': process.env.FIREBASE_API_KEY || '',
                    'FIREBASE_AUTH_DOMAIN': process.env.FIREBASE_AUTH_DOMAIN || '',
                    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID || '',
                    'FIREBASE_STORAGE_BUCKET': process.env.FIREBASE_STORAGE_BUCKET || '',
                    'FIREBASE_MESSAGING_SENDER_ID': process.env.FIREBASE_MESSAGING_SENDER_ID || '',
                    'FIREBASE_APP_ID': process.env.FIREBASE_APP_ID || '',
                    'FIREBASE_MEASUREMENT_ID': process.env.FIREBASE_MEASUREMENT_ID || ''
                };
                
                for (const [key, value] of Object.entries(keys)) {
                    const regex = new RegExp(`"INJECT_${key}"|'INJECT_${key}'`, 'g');
                    code = code.replace(regex, `"${value}"`);
                }
            }

            // Cache bust ES module relative imports inside JS files (e.g. import ... from './data/coding-problems.js')
            code = code.replace(/from\s+['"](\.{1,2}\/[^'"]+?\.js)(?:\?v=[^'"]*)?['"]/g, `from '$1?v=${BUILD_VERSION}'`);

            const stats = fs.statSync(absolutePath);
            if (stats.size > 500 * 1024) { // skip obfuscation for > 500KB
                console.log(`⚠️ Skipping obfuscation for large file: ${file}`);
                fs.writeFileSync(absolutePath, code);
                continue;
            }

            try {
                const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
                    compact: true,
                    controlFlowFlattening: false,
                    controlFlowFlatteningThreshold: 0,
                    deadCodeInjection: false,
                    deadCodeInjectionThreshold: 0,
                    debugProtection: false,     // Keep false to avoid breaking the app unnecessarily, set true to prevent developer tools completely
                    disableConsoleOutput: true, // Strips console.logs
                    identifierNamesGenerator: 'hexadecimal',
                    log: false,
                    numbersToExpressions: false,
                    renameGlobals: false,
                    selfDefending: false,       // Avoid bloating size with selfDefending check code
                    simplify: true,
                    splitStrings: false,
                    stringArray: true,
                    stringArrayEncoding: ['base64'],
                    stringArrayThreshold: 0.75,
                    transformObjectKeys: false,
                    unicodeEscapeSequence: false
                }).getObfuscatedCode();
                fs.writeFileSync(absolutePath, obfuscatedCode);
            } catch (e) {
                console.error(`Failed to obfuscate ${file}: ${e.message}`);
                fs.writeFileSync(absolutePath, code);
            }

        } else if (ext === '.html') {
            // MINIFY HTML
            console.log(`Minifying & Cache-busting HTML: ${file}`);
            let code = fs.readFileSync(absolutePath, 'utf8');
            
            // Append ?v= to any JS/CSS assets lacking it
            code = code.replace(/(\.(?:js|css))"/g, `$1?v=${BUILD_VERSION}"`);

            // Apply global dynamic cache-buster across all ?v= occurrences
            code = code.replace(/\?v=[0-9a-zA-Z.\-_]+/g, `?v=${BUILD_VERSION}`);

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
                fs.writeFileSync(absolutePath, code);
            }

        } else if (ext === '.css') {
            // MINIFY CSS
            console.log(`Minifying CSS: ${file}`);
            const code = fs.readFileSync(absolutePath, 'utf8');
            try {
                const minifiedCode = new CleanCSS({
                    level: {
                        1: {
                            all: true,
                            normalizeUrls: false // Avoid messing with relative paths
                        },
                        2: false // Disable level 2 optimizations (restructuring) for safety
                    }
                }).minify(code).styles;

                fs.writeFileSync(absolutePath, minifiedCode);
            } catch (e) {
                console.error(`Failed to minify CSS ${file}: ${e.message}`);
            }
        }
    }

    console.log('\n======================================================');
    console.log(`Build completed successfully! [Version: ${BUILD_VERSION}]`);
    console.log('Your code is now obfuscated and minified in the "dist" folder.');
    console.log('======================================================');
}

build().catch(err => {
    console.error('Build failed:', err);
});
