const https = require('https');

// Your Firebase project ID
const projectId = "skill-notes";
const databaseId = "notes"; // the named database

// Note data to upload
const noteData = {
    title: { stringValue: "Advanced Java Programming" },
    subjectName: { stringValue: "Advanced Java Programming" },
    subjectId: { stringValue: "Advanced Java Programming" },
    subject: { stringValue: "Advanced Java Programming" },
    unit: { stringValue: "UNIT- 1" },
    collegeName: { stringValue: "Medi-Caps University" },
    collegeId: { stringValue: "medicaps" },
    college: { stringValue: "medicaps" },
    branch: { stringValue: "cse" },
    semester: { stringValue: "Semester 4" },
    year: { stringValue: "2nd Year" },
    url: { stringValue: "https://drive.google.com/file/d/1oWspWtT2VdTwdmQCxrnmgShSZ2cW-ze2/view" },
    fileUrl: { stringValue: "https://drive.google.com/file/d/1oWspWtT2VdTwdmQCxrnmgShSZ2cW-ze2/view" },
    driveLink: { stringValue: "https://drive.google.com/file/d/1oWspWtT2VdTwdmQCxrnmgShSZ2cW-ze2/view" },
    uploader: { stringValue: "Tanishq Agrawal" },
    uploaderName: { stringValue: "Tanishq Agrawal" },
    status: { stringValue: "approved" },
    type: { stringValue: "notes" },
    likes: { integerValue: "0" },
    views: { integerValue: "0" },
    downloads: { integerValue: "0" },
    dislikes: { integerValue: "0" }
};

const payload = JSON.stringify({ fields: noteData });

const options = {
    hostname: 'firestore.googleapis.com',
    port: 443,
    path: `/v1/projects/${projectId}/databases/${databaseId}/documents/notes`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Successfully created document in Firestore!');
            try {
                const json = JSON.parse(data);
                console.log('Document ID:', json.name.split('/').pop());
            } catch (e) {
                console.log('Response:', data);
            }
        } else {
            console.error('❌ Failed to create document. Status:', res.statusCode);
            console.error('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
