import fetch from 'node-fetch';
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

function cleanCompanyName(folderName) {
    const special = {
        "google": "Google",
        "amazon": "Amazon",
        "microsoft": "Microsoft",
        "meta": "Meta",
        "facebook": "Meta",
        "apple": "Apple",
        "uber": "Uber",
        "adobe": "Adobe",
        "bloomberg": "Bloomberg",
        "goldman-sachs": "Goldman Sachs",
        "bytedance": "ByteDance",
        "linkedin": "LinkedIn",
        "palantir": "Palantir",
        "tiktok": "TikTok",
        "tcs": "TCS",
        "infosys": "Infosys",
        "wipro": "Wipro",
        "cognizant": "Cognizant",
        "accenture": "Accenture",
        "hcl": "HCLTech",
        "capgemini": "Capgemini",
        "jpmorgan": "JPMorgan Chase",
        "netflix": "Netflix",
        "salesforce": "Salesforce",
        "spotify": "Spotify",
        "walmart": "Walmart",
        "oracle": "Oracle",
        "cisco": "Cisco",
        "intel": "Intel",
        "nvidia": "NVIDIA",
        "tesla": "Tesla",
        "twitter": "Twitter",
        "stripe": "Stripe",
        "zoom": "Zoom",
        "sap": "SAP",
        "paypal": "PayPal",
        "ebay": "eBay",
        "snapchat": "Snapchat",
        "square": "Square",
        "dropbox": "Dropbox"
    };

    if (special[folderName.toLowerCase()]) {
        return special[folderName.toLowerCase()];
    }

    return folderName
        .split(/[-_]+/)
        .map(word => {
            if (word.toUpperCase() === "AI" || word.toUpperCase() === "IT") {
                return word.toUpperCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

async function main() {
    const realMap = {}; // id -> Set of company names

    console.log("1. Fetching all company directory names from GitHub API...");
    const url = 'https://api.github.com/repos/snehasishroy/leetcode-companywise-interview-questions/contents';
    
    let directories = [];
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'node-fetch-app' } });
        if (!res.ok) {
            console.log(`Failed to fetch directory contents: ${res.status} ${res.statusText}`);
            return;
        }
        const data = await res.json();
        directories = data.filter(item => item.type === 'dir').map(item => item.name);
        console.log(`Found ${directories.length} company directories.`);
    } catch(e) {
        console.error("API error:", e);
        return;
    }

    console.log("2. Fetching CSV files for all companies in chunks...");
    
    // Chunk size to prevent too many parallel socket connections
    const chunkSize = 50;
    
    for (let i = 0; i < directories.length; i += chunkSize) {
        const chunk = directories.slice(i, i + chunkSize);
        console.log(`Fetching chunk ${i / chunkSize + 1} of ${Math.ceil(directories.length / chunkSize)}...`);
        
        await Promise.all(chunk.map(async (folderName) => {
            const displayName = cleanCompanyName(folderName);
            
            // Try 'all.csv' first, fallback to 'three-months.csv'
            const fileNames = ['all.csv', 'three-months.csv', 'six-months.csv', 'thirty-days.csv'];
            let csvText = "";
            let fetched = false;

            for (const fileName of fileNames) {
                const csvUrl = `https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master/${folderName}/${fileName}`;
                try {
                    const res = await fetch(csvUrl);
                    if (res.ok) {
                        csvText = await res.text();
                        fetched = true;
                        break;
                    }
                } catch(e) {}
            }

            if (!fetched) return;

            // Parse CSV lines
            const lines = csvText.split('\n');
            for (let j = 1; j < lines.length; j++) {
                const line = lines[j].trim();
                if (!line) continue;
                const parts = line.split(',');
                const idStr = parts[0].replace(/"/g, '').trim();
                const id = parseInt(idStr, 10);
                if (!isNaN(id)) {
                    if (!realMap[id]) {
                        realMap[id] = new Set();
                    }
                    realMap[id].add(displayName);
                }
            }
        }));
    }

    // Now load coding-problems.js
    let content = readFileSync('./js/data/coding-problems.js', 'utf-8');
    content = content.replace(/export\s+const\s+codingProblems\s*=/, 'const codingProblems =');
    content += '\n\nmodule.exports = { codingProblems };';
    writeFileSync('./coding-problems-temp.cjs', content, 'utf-8');

    const require = createRequire(import.meta.url);
    const { codingProblems } = require('./coding-problems-temp.cjs');

    let updatedCount = 0;
    let emptyCount = 0;

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

    codingProblems.forEach((p) => {
        const id = p.id;
        const realCompanies = realMap[id];
        if (realCompanies && realCompanies.size > 0) {
            p.companies = sortCompanies(Array.from(realCompanies));
            updatedCount++;
        } else {
            p.companies = [];
            emptyCount++;
        }
    });

    console.log(`Verification:`);
    console.log(`Problems updated with real companies: ${updatedCount}`);
    console.log(`Problems with zero company matches: ${emptyCount}`);

    // Serialize back to JS
    const newFileContent = `// SKiL MATRiX Algorithmic Arena Dataset (2000 clean, user-friendly algorithmic challenges)
export const codingProblems = ${JSON.stringify(codingProblems, null, 4)};
`;

    writeFileSync('./js/data/coding-problems.js', newFileContent, 'utf-8');
    writeFileSync('./dist/js/data/coding-problems.js', newFileContent, 'utf-8');
    console.log("Successfully wrote updated problems to development and production files.");
}

main();
