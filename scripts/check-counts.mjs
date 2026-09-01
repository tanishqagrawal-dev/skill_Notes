import { readFileSync } from 'fs';
import { resolve } from 'path';

const content = readFileSync(resolve('./js/data/coding-problems.js'), 'utf-8');
const jsonStr = content.replace(/^\/\/.*?\n/, '').replace(/^export const codingProblems = /, '').replace(/;?\s*$/, '');
const codingProblems = JSON.parse(jsonStr);

console.log("Total Problems:", codingProblems.length);

const comps = {};
codingProblems.forEach(p => {
    (p.companies || []).forEach(c => {
        comps[c] = (comps[c] || 0) + 1;
    });
});

console.log("Top 25 Companies by Question Count:");
Object.entries(comps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .forEach(([c, n], i) => {
        console.log(`${i+1}. ${c}: ${n} problems`);
    });

const diffs = {};
codingProblems.forEach(p => { diffs[p.difficulty] = (diffs[p.difficulty] || 0) + 1; });
console.log("Difficulties:", diffs);

const categories = {};
codingProblems.forEach(p => { categories[p.category] = (categories[p.category] || 0) + 1; });
console.log("Categories count:", Object.keys(categories).length);

