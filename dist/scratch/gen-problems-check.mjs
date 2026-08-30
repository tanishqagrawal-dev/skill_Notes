// Verify all 2000 coding problems with the current wrapper and template logic
import { readFileSync, writeFileSync } from 'fs';

// 1. Read codingProblems
const rawProblems = readFileSync('./js/data/coding-problems.js', 'utf-8');
const match = rawProblems.match(/export const codingProblems = (\[[\s\S]*\]);/);
if (!match) {
    console.error('Could not find codingProblems array in js/data/coding-problems.js');
    process.exit(1);
}
const problems = JSON.parse(match[1]);
console.log(`Loaded ${problems.length} problems.`);

// 2. Read coding-arena.js wrapper logic and functions
const arenaCode = readFileSync('./js/coding-arena.js', 'utf-8');

// We will extract parseTestCaseInput, getCaOptimalSolution, and preprocessCode equivalent logic
const pStart = arenaCode.indexOf('function parseTestCaseInput');
const pEnd = arenaCode.indexOf('window.executeWithPaiza');
const parseFuncStr = arenaCode.substring(pStart, pEnd);

const solStart = arenaCode.indexOf('window.getCaOptimalSolution');
const solEnd = arenaCode.indexOf('window.loadSolutionTemplate');
const getSolFuncStr = arenaCode.substring(solStart, solEnd);

// Let's create a sandboxed runner context
const sandbox = {
    console: console,
    JSON: JSON,
    Map: Map,
    Set: Set,
    ArrayList: Array,
    Object: Object,
    String: String,
    RegExp: RegExp,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    Math: Math
};

// We will construct a dynamic script that runs the checks
const runScript = `
${parseFuncStr}
const window = {};
${getSolFuncStr}
const getCaOptimalSolution = window.getCaOptimalSolution;

// Mock problem details matching client preprocessing
// We extract the core wrapper logic from coding-arena.js or rewrite the preprocess wrapper check
`;

// Let's write a custom checker to analyze all problems in memory
const results = [];
let cppFail = 0, javaFail = 0, csFail = 0, pyFail = 0, jsFail = 0, cFail = 0;

// Import the wrapper logic we wrote in live-tests to check code structure
// We can check each problem and log errors
const preprocessMatch = arenaCode.match(/window\.executeWithPaiza\s*=\s*async\s*function\s*\(([^)]+)\)\s*\{([\s\S]*?)\n\}/);
// Instead of copy-pasting the massive executeWithPaiza, let's extract the actual preprocessing code blocks for each language.
// Let's do it directly in Node.

// Let's parse executeWithPaiza logic into structured functions for check
// Let's write check-all-problems.js
const checkerScript = `
import { readFileSync } from 'fs';

const raw = readFileSync('./js/data/coding-problems.js', 'utf-8');
const match = raw.match(/export const codingProblems = (\[[\\s\\S]*?\]);/);
const problems = JSON.parse(match[1]);

const arena = readFileSync('./js/coding-arena.js', 'utf-8');

// Extract getCaOptimalSolution and parseTestCaseInput
const parseStart = arena.indexOf('function parseTestCaseInput');
const parseEnd = arena.indexOf('window.executeWithPaiza');
const parseFunc = new Function('inputStr', arena.substring(parseStart, parseEnd) + '\\nreturn parseTestCaseInput(inputStr);');

const solStart = arena.indexOf('window.getCaOptimalSolution');
const solEnd = arena.indexOf('window.loadSolutionTemplate');
// Extract the body of getCaOptimalSolution
let solCode = arena.substring(solStart, solEnd);
// Replace window.getCaOptimalSolution = function(...) with function getCaOptimalSolution(...)
solCode = solCode.replace('window.getCaOptimalSolution = function', 'function getCaOptimalSolution');
// Add parseTestCaseInput dependency inside it
solCode = solCode + '\\n' + arena.substring(parseStart, parseEnd);

const getOptimalSolution = new Function('problem', 'lang', solCode + '\\nreturn getCaOptimalSolution(problem, lang);');

console.log('Validating all 2000 problems...');

const errors = [];

for (const p of problems) {
    const title = p.title;
    const testCases = p.testCases || [];
    if (testCases.length === 0) {
        errors.push({ id: p.id, title, error: 'No test cases defined' });
        continue;
    }
    
    const sampleInput = testCases[0].i || testCases[0].input || "";
    if (!sampleInput.trim()) {
        errors.push({ id: p.id, title, error: 'Empty testcase input' });
        continue;
    }
    
    // Check all 6 languages
    const languages = ['cpp', 'java', 'csharp', 'python', 'javascript', 'c'];
    for (const lang of languages) {
        try {
            const code = getOptimalSolution(p, lang);
            if (!code || code.trim() === "") {
                errors.push({ id: p.id, title, lang, error: 'Generated empty solution code' });
                continue;
            }
            if (lang === 'c' && p.id > 2 && code.includes('// C Solution')) {
                // The C dynamic generator returns a comment for all problems except id 1 and 2
                errors.push({ id: p.id, title, lang, error: 'C solution is just a comment placeholder' });
            }
        } catch (e) {
            errors.push({ id: p.id, title, lang, error: 'Crash during solution generation: ' + e.message });
        }
    }
}

console.log('=== VERIFICATION SUMMARY ===');
console.log('Total errors/warnings found:', errors.length);
const categories = {};
errors.forEach(err => {
    categories[err.error] = (categories[err.error] || 0) + 1;
});
console.log(JSON.stringify(categories, null, 2));

// Save detailed report
import { writeFileSync } from 'fs';
writeFileSync('C:/Users/tanis/.gemini/antigravity-ide/brain/0ca4e7e8-d884-4865-811e-66ea988c92a4/scratch/problems-report.json', JSON.stringify(errors, null, 2));
console.log('Report saved to scratch/problems-report.json');
`;

writeFileSync('C:/Users/tanis/.gemini/antigravity-ide/brain/0ca4e7e8-d884-4865-811e-66ea988c92a4/scratch/check-problems.mjs', checkerScript);
console.log('Generated problem check script.');
