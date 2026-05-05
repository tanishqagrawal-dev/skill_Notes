require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'service-account.json');

try {
    if (require('fs').existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔑 Authenticated using local service-account.json");
    } else {
        // Fallback to Application Default Credentials (matches your request)
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        console.log("☁️  Authenticated using Google Application Default Credentials");
    }
} catch (e) {
    console.error("Auth Init Error:", e);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoints
app.post('/api/generate-paper', async (req, res) => {
    try {
        const { subject, university, semester, examType, pyqs } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API Key not configured in server/.env" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are an experienced university exam paper setter.

Input:
- Subject: ${subject}
- University: ${university}
- Semester: ${semester}
- Exam Type: ${examType}
- Past Year Questions:
${pyqs}

Tasks:
1. Analyze question patterns and frequently asked topics from the provided PYQs.
2. Identify important units and repeated concepts.
3. Generate a MODEL QUESTION PAPER:
   - Must follow a standard university format.
   - Balanced difficulty (Easy, Medium, Hard).
   - Proper marks distribution.
4. Clearly label:
   - Section A (MCQ / Short Answer)
   - Section B (Medium Answer)
   - Section C (Long Answer / Case Study)

Rules:
- Do NOT simply copy the PYQs. Create VARIATIONS or new relevant questions based on the same topics.
- Keep it practical and realistic.

Output format:
Please provide the output in clean Markdown format with bold headers.
Start with the Title Block (Subject, Marks, Time).
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ success: true, maxMarks: 70, content: text });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/generate-plan', async (req, res) => {
    try {
        const { subjects, examDate, weakTopics, hoursAvailable, currentLevel } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API Key not configured server-side" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const daysLeft = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));

        const prompt = `
You are an advanced AI Study Coach for a university student.
Goal: Create a highly efficient, realistic daily study schedule for TODAY.

Context:
- Subjects to cover: ${subjects.join(', ')}
- Upcoming Exam: In ${daysLeft} days.
- User's Weak Topics: ${weakTopics.join(', ')}
- Available Time: ${hoursAvailable} hours today.
- Current Prep Level: ${currentLevel || 'Intermediate'}

Instructions: 
1. Create a JSON plan splitting the ${hoursAvailable} hours into chunks.
2. Prioritize WEAK TOPICS immediately if the exam is close (< 7 days).
3. Include specific "Activity Types":
   - "Learn": Studying new concepts.
   - "Practice": Solving questions/PYQs.
   - "Revise": Rapid review.
4. For each task, provide a "reasoning" (Why this task now?).

Constraint:
- Output MUST be a valid JSON array of objects.
- Objects must have keys: "time", "activity", "topic", "reasoning", "type" (learn/practice/revise).
- NO Markdown formatting (\`\`\`json), just the raw JSON string.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const plan = JSON.parse(text);
            res.json({ success: true, plan });
        } catch (e) {
            console.error("JSON Parse Error:", text);
            res.status(500).json({ success: false, error: "Failed to parse AI plan", raw: text });
        }

    } catch (error) {
        console.error("Planner Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/generate-model-paper', async (req, res) => {
    try {
        const { prompt } = req.body;
        let responseContent = null;
        let geminiFailed = false;

        // 1. Try Gemini API First
        try {
            const geminiKey = process.env.GEMINI_API_KEY;
            if (geminiKey) {
                console.log("✨ [Tier 1] Attempting Gemini API Generation...");
                // Initialize a temporary local genAI with the exact key just in case it differs
                const localGenAI = new GoogleGenerativeAI(geminiKey);
                const model = localGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                responseContent = response.text();
            } else {
                throw new Error("GEMINI_API_KEY not found in .env");
            }
        } catch (geminiError) {
            console.warn("⚠️ [Tier 1] Gemini API Failed or Limit Reached:", geminiError.message);
            geminiFailed = true;
        }

        // 2. Fallback to Groq API if Gemini fails
        if (geminiFailed || !responseContent) {
            console.log("♻️ [Tier 2] Falling back to Groq API Generation...");
            const groqKey = process.env.GROQ_API_KEY;

            if (!groqKey) {
                throw new Error("GROQ_API_KEY not configured and Gemini failed.");
            }

            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                })
            });

            if (!groqRes.ok) {
                const errData = await groqRes.json();
                throw new Error(errData.error?.message || `Groq API Error: ${groqRes.status}`);
            }

            const data = await groqRes.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error("Invalid response from Groq API");
            }

            responseContent = data.choices[0].message.content;
        }

        res.json({ content: responseContent });

    } catch (error) {
        // If both fail, throwing 500 triggers the frontend to use the Local Cache fallback (Tier 3)
        console.error("❌ Both AI Generations Failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- LOCAL PAPER PERSISTENCE (NON-FIREBASE) ---
const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'cached_papers.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify([]));

// Serve frontend files (Moved below API for priority)
app.use(express.static(path.join(__dirname, "..")));

// Save generated paper to local cache
app.post('/api/save-paper', (req, res) => {
    try {
        const { subjectId, subjectName, examType, content } = req.body;
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        
        // Add new paper
        console.log(`📝 Saving paper to cache: ${subjectName} (${examType})`);
        data.push({
            id: Date.now(),
            subjectId,
            subjectName,
            examType,
            content,
            createdAt: new Date().toISOString()
        });
        
        // Keep only last 100 papers or so to avoid huge files
        if (data.length > 200) data.shift();
        
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: "Paper saved to local cache" });
    } catch (e) {
        console.error("Save Cache Error:", e);
        res.status(500).json({ error: "Failed to save to local cache" });
    }
});

// Get random paper from local cache (Fallback)
app.get('/api/get-random-paper', (req, res) => {
    try {
        const { subjectId, examType } = req.query;
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        
        const matches = data.filter(p => p.subjectId === subjectId && p.examType === examType);
        
        if (matches.length === 0) {
            return res.status(404).json({ error: "No cached papers found for this subject/type" });
        }
        
        const randomPaper = matches[Math.floor(Math.random() * matches.length)];
        res.json({ success: true, paper: randomPaper.content });
    } catch (e) {
        res.status(500).json({ error: "Failed to read local cache" });
    }
});

app.listen(port, () => {
    console.log(`\n🚀 AI Server running at http://localhost:${port}`);
    console.log(`📂 Local Cache active at data/cached_papers.json`);
});
