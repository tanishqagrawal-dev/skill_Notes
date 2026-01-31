const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.generateModelPaper = functions.https.onCall(
    async (data, context) => {

        // 🔒 Optional: allow only logged-in users
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "Login required"
            );
        }

        const { subject, syllabus, pyqs } = data;
        const API_KEY = process.env.AI_KEY;

        const prompt = `
You are a university exam paper setter.

Subject: ${subject}
Syllabus: ${syllabus}
Past Year Questions:
${pyqs}

Create a realistic model question paper with:
- Section A (short)
- Section B (medium)
- Section C (long)
Include marks and time.
`;

        try {
            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                }
            );

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Gemini API HTTP Error:", errorBody);
                throw new Error("Gemini API failed with status " + response.status);
            }

            const result = await response.json();

            if (result.error) {
                console.error("Gemini API Error:", result.error);
                throw new functions.https.HttpsError("internal", result.error.message);
            }

            return { paper: result.candidates[0].content.parts[0].text };
        } catch (error) {
            console.error("Function Error:", error);
            throw new functions.https.HttpsError("internal", error.message);
        }
    }
);

exports.examStrategist = functions.https.onCall(
    async (data, context) => {

        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "Login required"
            );
        }

        const { subject, daysLeft, weakTopics } = data;
        const API_KEY = process.env.AI_KEY;

        const prompt = `
You are an exam preparation strategist.

Subject: ${subject}
Days left: ${daysLeft}
Weak topics: ${weakTopics}

Create a day-wise smart exam strategy with:
- What to study
- Revision schedule
- PYQs focus
- Final tips
`;

        try {
            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                }
            );

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Gemini API HTTP Error:", errorBody);
                throw new Error("Gemini API returned " + response.status);
            }

            const result = await response.json();

            if (result.error) {
                console.error("Gemini API Error:", result.error);
                throw new functions.https.HttpsError("internal", result.error.message);
            }

            return { strategy: result.candidates[0].content.parts[0].text };
        } catch (error) {
            console.error("Function Error:", error);
            throw new functions.https.HttpsError("internal", error.message);
        }
    }
);
