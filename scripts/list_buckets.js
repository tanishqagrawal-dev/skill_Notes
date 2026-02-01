const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'server', 'service-account.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function listBuckets() {
    try {
        const [buckets] = await admin.storage().getBuckets();
        console.log("Available Buckets:");
        buckets.forEach(b => console.log("- " + b.name));
    } catch (e) {
        console.error("Error listing buckets:", e);
    }
}

listBuckets();
