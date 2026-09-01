import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { resolve } from 'path';

const require = createRequire(import.meta.url);
const tempPath = resolve('./coding-problems-temp.cjs');
const { codingProblems } = require(tempPath);

const CA_COMPANIES = [
    "Google", "Amazon", "Microsoft", "Meta", "Uber", "Oracle", "Apple", "Goldman Sachs",
    "TCS", "Zoho", "Infosys", "Salesforce", "IBM", "LinkedIn", "Adobe", "NVIDIA",
    "Walmart Labs", "Accenture", "Visa", "Flipkart", "PayPal", "Phonepe", "De Shaw",
    "Snowflake", "Cisco", "Snapchat", "Servicenow", "Doordash", "JPMorgan Chase",
    "Nutanix", "eBay", "Morgan Stanley", "Qualcomm", "Expedia", "Samsung", "Intuit",
    "Airbnb", "Palo Alto Networks", "Agoda", "Atlassian", "SAP", "Deloitte",
    "Cognizant", "Swiggy", "Pinterest", "Wipro", "HCLTech", "Capgemini"
];

console.log("Total Problems:", codingProblems.length);
CA_COMPANIES.forEach(comp => {
    const count = codingProblems.filter(p => (p.companies || []).some(c => c.toLowerCase() === comp.toLowerCase())).length;
    console.log(`${comp}: ${count} Questions`);
});
