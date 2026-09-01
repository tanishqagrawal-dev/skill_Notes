import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const COMPANY_PRIORITY_ORDER = [
    "Amazon", "Google", "Microsoft", "Meta", "Apple", "Bloomberg", "Netflix", "Uber",
    "Goldman Sachs", "Adobe", "Salesforce", "LinkedIn", "ByteDance", "TikTok", "NVIDIA",
    "Oracle", "Cisco", "JPMorgan Chase", "Morgan Stanley", "De Shaw", "Citadel",
    "Airbnb", "Stripe", "Spotify", "PayPal", "Walmart Labs", "Flipkart", "Swiggy",
    "Zomato", "Paytm", "Phonepe", "Atlassian", "Snowflake", "Palantir", "Nutanix",
    "Palo Alto Networks", "Doordash", "Databricks", "Snapchat", "Pinterest", "Twitter",
    "Roblox", "Samsung", "Intuit", "eBay", "Expedia", "Agoda", "SAP", "Tesla",
    "Intel", "AMD", "Zoho", "IBM", "TCS", "Infosys", "Wipro", "Cognizant",
    "Accenture", "HCLTech", "Capgemini", "Deloitte"
];

const COMPANY_PRIORITY_MAP = {};
COMPANY_PRIORITY_ORDER.forEach((c, idx) => {
    COMPANY_PRIORITY_MAP[c.toLowerCase()] = COMPANY_PRIORITY_ORDER.length - idx;
});

function sortCompanies(comps) {
    if (!comps || !Array.isArray(comps)) return [];
    return [...comps].sort((a, b) => {
        const pA = COMPANY_PRIORITY_MAP[a.toLowerCase()] || 0;
        const pB = COMPANY_PRIORITY_MAP[b.toLowerCase()] || 0;
        if (pA !== pB) return pB - pA;
        return a.localeCompare(b);
    });
}

// 1. Read coding-problems.js
let content = readFileSync('./js/data/coding-problems.js', 'utf-8');
content = content.replace(/export\s+const\s+codingProblems\s*=/, 'const codingProblems =');
content += '\n\nmodule.exports = { codingProblems };';
import { resolve } from 'path';
const tempPath = resolve('./coding-problems-temp.cjs');
writeFileSync(tempPath, content, 'utf-8');

const require = createRequire(import.meta.url);
const { codingProblems } = require(tempPath);

let totalSorted = 0;
codingProblems.forEach(p => {
    if (p.companies && Array.from(p.companies).length > 0) {
        // Remove duplicates if any
        const unique = Array.from(new Set(p.companies));
        p.companies = sortCompanies(unique);
        totalSorted++;
    }
});

console.log(`Sorted companies for ${totalSorted} problems.`);
console.log(`Sample Problem 1 (${codingProblems[0].title}) companies:`, codingProblems[0].companies.slice(0, 10));
console.log(`Sample Problem 2 (${codingProblems[1].title}) companies:`, codingProblems[1].companies.slice(0, 10));
console.log(`Sample Problem 3 (${codingProblems[2].title}) companies:`, codingProblems[2].companies.slice(0, 10));

const outputContent = `// SKiL MATRiX Algorithmic Arena Dataset (2000 clean, user-friendly algorithmic challenges)\nexport const codingProblems = ${JSON.stringify(codingProblems, null, 4)};\n`;

writeFileSync('./js/data/coding-problems.js', outputContent, 'utf-8');
try {
    writeFileSync('./dist/js/data/coding-problems.js', outputContent, 'utf-8');
} catch(e) {}

console.log('Successfully updated js/data/coding-problems.js and dist/js/data/coding-problems.js');
