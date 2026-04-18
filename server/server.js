const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
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
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoints
app.post('/api/generate-paper', async (req, res) => {
    try {
        const { subject, university, semester, examType, pyqs } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API Key not configured in server/.env" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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

/**
 * SECURE AI PAPER GENERATION
 * This endpoint replaces the hardcoded frontend API calls.
 */
app.post('/api/ai/generate-model-paper', async (req, res) => {
    try {
        const { subject, type, syllabus } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Server API Key not configured" });
        }

        const isMST = type.includes('MST');
        
        let structureInstructions = "";
        if (isMST) {
            structureInstructions = `
            STRICT MST STRUCTURE (20 Marks Total):
            - NO MCQS.
            - Q1: i (2 marks), ii (3 marks), iii (5 marks) OR iv (5 marks). Total: 10.
            - Q2: i (2 marks), ii (3 marks), iii (5 marks) OR iv (5 marks). Total: 10.
            - SUM: 10 + 10 = 20 marks.
            - Sections: "Section A" for Q1, "Section B" for Q2.
            - DO NOT INCLUDE unit names or numbers in Section titles.
            `;
        } else {
            structureInstructions = `
            STRICT END SEM STRUCTURE (60 Marks Total):
            - 5 Sections (Section A to E). 12 Marks per section.
            - Absolute numbering from Q1 to Q15 across all sections.
            - Each Section has exactly 3 questions:
              - First: 2 marks.
              - Second: 4 marks.
              - Third: "a" (6 marks) OR "b" (6 marks).
            - Example Section A: Q1 (2), Q2 (4), Q3 a (6) OR Q3 b (6).
            - Example Section B: Q4 (2), Q5 (4), Q6 a (6) OR Q6 b (6).
            - Total per section: 12. SUM: 12 * 5 = 60 marks.
            - DO NOT INCLUDE unit names or numbers in Section titles. Just use "Section A", "Section B", etc.
            `;
        }

        const prompt = `You are an expert exam paper setter for SKiL MATRiX. 
        Create a high-quality Model Question Paper for "${subject}" (${type}). 
        Syllabus Context (Use ONLY these units): ${syllabus || "Official university pattern"}.
        
        ${structureInstructions}
        
        Guidelines:
        1. If MST 1: Include only questions from Unit 1 and Unit 2.
        2. If MST 2: Include only questions from Unit 3 and Unit 4.
        3. If End Sem: Include questions from all 5 Units.
        4. EVERY sub-question and OR-question must include: marks, bl (01-04), co (01-05), po (1-12), pso (1-3).
        5. Structure the questions professionally as requested.
        
        Format: JSON only.
        Structure: {
            "university": "SKiL MATRiX",
            "examTitle": "${type} 2026",
            "subjectCode": "SKL-MOD",
            "subjectName": "${subject}",
            "sections": [
                {
                    "title": "Section A",
                    "questions": [
                        {
                            "id": "1",
                            "subQuestions": [
                                {"id": "i", "text": "...", "marks": "...", "bl": "01", "co": "01", "po": "1", "pso": "1"}
                            ],
                            "orQuestion": {"id": "...", "text": "...", "marks": "...", "bl": "02", "co": "01", "po": "1", "pso": "1"}
                        }
                    ]
                }
            ]
        }`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const paper = JSON.parse(text);
            res.json(paper);
        } catch (e) {
            console.error("JSON Parse Error in Paper Generation:", text);
            res.status(500).json({ error: "Failed to parse AI response as JSON", raw: text });
        }

    } catch (error) {
        console.error("AI Paper Generation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Cleanup: Handle 404 for API routes specifically to avoid returning HTML
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'AI-Generator-Backend' });
});

app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

// Serve frontend files
app.use(express.static(path.join(__dirname, "..")));

// Clean URL Rewrites (Matches Netlify/Firebase behavior)
app.get('/pages/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, "..", "pages", "dashboard.html"));
});

app.get('/pages/notes', (req, res) => {
    res.sendFile(path.join(__dirname, "..", "pages", "notes.html"));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Fallback for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

// --- LOCAL PAPER PERSISTENCE (NON-FIREBASE) ---
const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'cached_papers.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(CACHE_FILE)) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify([]));
    } catch (e) {
        console.error("Failed to create cache file:", e);
    }
}

// Save generated paper to local cache
app.post('/api/save-paper', (req, res) => {
    try {
        const { subjectId, subjectName, examType, content } = req.body;
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        
        data.push({
            id: Date.now(),
            subjectId,
            subjectName,
            examType,
            content,
            createdAt: new Date().toISOString()
        });
        
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
