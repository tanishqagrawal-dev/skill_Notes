const admin = require('firebase-admin');
const serviceAccount = require('../server/service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function fixNote() {
    const noteId = 'LfvgQAMYiE8sr1lw4T5i';
    console.log(`Fixing note ${noteId}...`);

    try {
        const docRef = admin.firestore().collection('notes_approved').doc(noteId);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.log("Document not found!");
            return;
        }

        const data = doc.data();
        if (!data.approvedAt) {
            await docRef.update({
                approvedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ Updated approvedAt field.");
        } else {
            console.log("approvedAt already exists.");
        }

    } catch (error) {
        console.error("❌ Correction failed:", error);
    }
}

fixNote();
