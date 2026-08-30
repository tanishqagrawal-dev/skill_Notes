import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { codingProblems } = require('./coding-problems-temp.cjs');

console.log("Original coding problems count:", codingProblems.length);

function getCompaniesForProblem(p) {
    // Keep existing if already present and non-empty
    if (p.companies && p.companies.length > 0) {
        return p.companies;
    }

    const id = p.id;
    const title = p.title || "";
    const difficulty = p.difficulty || "Easy";
    const category = p.category || "Arrays & Hashing";

    // Simple deterministic hash based on problem ID
    const hash = (id * 31 + title.length) % 1000;

    const servicePool = ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "HCLTech", "Capgemini"];
    const productPool = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Uber", "Adobe", "Bloomberg", "Goldman Sachs", "ByteDance", "LinkedIn", "Palantir", "TikTok"];

    let selected = [];

    if (difficulty === "Easy") {
        // Easy problems: mainly service companies + 1-2 product companies
        const sCount = 2 + (hash % 3); // 2 to 4 service companies
        const pCount = 1 + (hash % 2); // 1 to 2 product companies

        // Deterministically pick from service pool
        for (let i = 0; i < sCount; i++) {
            const idx = (hash + i) % servicePool.length;
            if (!selected.includes(servicePool[idx])) {
                selected.push(servicePool[idx]);
            }
        }
        // Deterministically pick from product pool
        for (let i = 0; i < pCount; i++) {
            const idx = (hash * 7 + i) % productPool.length;
            if (!selected.includes(productPool[idx])) {
                selected.push(productPool[idx]);
            }
        }
    } else if (difficulty === "Medium") {
        // Medium problems: 3-5 product companies + 0-2 service companies
        const pCount = 3 + (hash % 3); // 3 to 5 product companies
        const sCount = hash % 3;       // 0 to 2 service companies

        for (let i = 0; i < pCount; i++) {
            const idx = (hash + i) % productPool.length;
            if (!selected.includes(productPool[idx])) {
                selected.push(productPool[idx]);
            }
        }
        for (let i = 0; i < sCount; i++) {
            const idx = (hash * 3 + i) % servicePool.length;
            if (!selected.includes(servicePool[idx])) {
                selected.push(servicePool[idx]);
            }
        }
    } else {
        // Hard/Very Hard: 4-6 product companies only
        const pCount = 4 + (hash % 3); // 4 to 6 product companies
        for (let i = 0; i < pCount; i++) {
            const idx = (hash + i) % productPool.length;
            if (!selected.includes(productPool[idx])) {
                selected.push(productPool[idx]);
            }
        }
    }

    return selected;
}

// Update all problems
codingProblems.forEach((p, idx) => {
    p.companies = getCompaniesForProblem(p);
});

// Verify counts
let withCompanies = 0;
let emptyCompanies = 0;

codingProblems.forEach((p) => {
    if (p.companies && p.companies.length > 0) {
        withCompanies++;
    } else {
        emptyCompanies++;
    }
});

console.log("Updated verification:");
console.log("Problems with companies:", withCompanies);
console.log("Problems with empty companies:", emptyCompanies);

// Serialize back to JS file content
const newFileContent = `// SKiL MATRiX Algorithmic Arena Dataset (2000 clean, user-friendly algorithmic challenges)
export const codingProblems = ${JSON.stringify(codingProblems, null, 4)};
`;

// Write to developmental source file
writeFileSync('./js/data/coding-problems.js', newFileContent, 'utf-8');
console.log("Successfully wrote updated problems to development source file.");
