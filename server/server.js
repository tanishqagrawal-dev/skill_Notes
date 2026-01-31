require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

app.get('/', (req, res) => {
    res.send('SkillMatrix AI Server is Running. 🤖');
});

app.listen(port, () => {
    console.log(`\n🚀 AI Server running at http://localhost:${port}`);
    console.log(`⚠️  Make sure you have added your GEMINI_API_KEY to server/.env`);
});
