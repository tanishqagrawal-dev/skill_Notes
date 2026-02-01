const admin = require('firebase-admin');
const serviceAccount = require('../server/service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function checkNotes() {
    console.log("Checking notes_approved collection...");
    const snapshot = await admin.firestore().collection('notes_approved').get();

    if (snapshot.empty) {
        console.log("No approved notes found.");
        return;
    }

    console.log(`Found ${snapshot.size} notes.`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\nID: ${doc.id}`);
        console.log(`Title: ${data.title}`);
        console.log(`Subject: '${data.subject}' (Type: ${typeof data.subject})`);
        console.log(`CollegeId: '${data.collegeId}'`);
        console.log(`Type: '${data.type}'`);
        console.log(`Status: '${data.status}'`);
        console.log(`ApprovedAt: ${data.approvedAt ? JSON.stringify(data.approvedAt) : 'MISSING'}`);
        console.log("-------------------");
    });
}

checkNotes();
