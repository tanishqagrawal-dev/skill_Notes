import fetch from 'node-fetch';
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const companyMapping = {
    "Google": "google",
    "Amazon": "amazon",
    "Microsoft": "microsoft",
    "Meta": "meta",
    "Apple": "apple",
    "Uber": "uber",
    "Adobe": "adobe",
    "Bloomberg": "bloomberg",
    "Goldman Sachs": "goldman-sachs",
    "ByteDance": "bytedance",
    "LinkedIn": "linkedin",
    "Palantir": "palantir",
    "TikTok": "tiktok",
    "TCS": "tcs",
    "Infosys": "infosys",
    "Wipro": "wipro",
    "Cognizant": "cognizant",
    "Accenture": "accenture",
    "HCLTech": "hcl",
    "Capgemini": "capgemini"
};

async function main() {
    const realMap = {}; // id -> Set of company names

    console.log("Fetching and parsing raw LeetCode company data from GitHub...");

    for (const [displayName, folderName] of Object.entries(companyMapping)) {
        // Try 'all.csv' first to get the most complete dataset, fallback to three-months.csv or six-months.csv
        const fileNames = ['all.csv', 'three-months.csv', 'six-months.csv', 'thirty-days.csv'];
        let success = false;
        let csvText = "";

        for (const fileName of fileNames) {
            const url = `https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master/${folderName}/${fileName}`;
            try {
                const res = await fetch(url);
                if (res.ok) {
                    csvText = await res.text();
                    console.log(`Fetched ${displayName} data from ${fileName}`);
                    success = true;
                    break;
                }
            } catch(e) {}
        }

        if (!success) {
            console.log(`⚠️ Failed to fetch any data for ${displayName}`);
            continue;
        }

        // Parse CSV lines
        const lines = csvText.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            // Split comma-separated values, handle optional quotes
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

    codingProblems.forEach((p) => {
        const id = p.id;
        const realCompanies = realMap[id];
        if (realCompanies && realCompanies.size > 0) {
            p.companies = Array.from(realCompanies);
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
