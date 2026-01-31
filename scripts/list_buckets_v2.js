const { Storage } = require('@google-cloud/storage');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'server', 'service-account.json'));

const storage = new Storage({
    projectId: serviceAccount.project_id,
    credentials: serviceAccount
});

async function listBuckets() {
    try {
        const [buckets] = await storage.getBuckets();
        console.log("Available Buckets:");
        buckets.forEach(b => console.log("- " + b.name));
    } catch (e) {
        console.error("Error listing buckets:", e);
    }
}

listBuckets();
