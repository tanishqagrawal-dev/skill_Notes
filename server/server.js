const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://begbdglouistmaughmot.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Razorpay
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

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

// Payment Plans Configuration
const PLANS = {
    'codetantra_1mo': { amount: 1900, name: 'CodeTantra Solutions - 1 Month', durationDays: 30 },
    'codetantra_2mo': { amount: 3500, name: 'CodeTantra Solutions - 2 Months', durationDays: 60 },
    'pro_1mo': { amount: 7900, name: 'Scholar PRO - 1 Month', durationDays: 30 },
    'pro_6mo': { amount: 29900, name: 'Scholar PRO - 6 Months', durationDays: 180 }
};

// --- PAYMENT ENDPOINTS ---

// 1. Create Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { planId, uid } = req.body;
        
        if (!razorpay) {
            return res.status(500).json({ error: "Razorpay keys not configured in server/.env" });
        }

        const plan = PLANS[planId];
        if (!plan) return res.status(400).json({ error: "Invalid plan selected" });
        if (!uid) return res.status(400).json({ error: "User ID required" });

        const options = {
            amount: plan.amount, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `rcpt_${uid.substring(0, 10)}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Verify Payment & Upgrade Plan
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, uid } = req.body;
        
        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ error: "Razorpay Secret not configured" });
        }

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: "Invalid payment signature" });
        }

        const plan = PLANS[planId];
        if (!plan) return res.status(400).json({ error: "Invalid plan" });

        // Calculate new expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

        // Normalize plan base ID (codetantra or pro)
        const basePlanId = planId.startsWith('codetantra') ? 'codetantra' : 'pro';

        // Update Supabase Database
        // 1. Log Payment
        await supabase.from('payment_logs').insert([{
            firebase_uid: uid,
            razorpay_order_id,
            razorpay_payment_id,
            plan_id: planId,
            amount_paid: plan.amount / 100,
            status: 'success'
        }]);

        // 2. Upsert User Plan
        const { error: upsertError } = await supabase.from('user_plans').upsert({
            firebase_uid: uid,
            plan_id: basePlanId,
            plan_expiry: expiryDate.toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'firebase_uid' });

        if (upsertError) {
            console.error("Supabase Upsert Error:", upsertError);
            throw new Error("Failed to update user plan in database");
        }

        res.json({ success: true, message: "Payment verified & plan upgraded", plan: basePlanId });
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Usage Limits Checker
app.post('/api/use-feature', async (req, res) => {
    try {
        const { uid, feature } = req.body; // feature: 'askDoubt' or 'modelPaper'
        
        if (!uid) return res.status(400).json({ error: "User ID required" });

        const { data, error } = await supabase.from('user_plans').select('*').eq('firebase_uid', uid).single();
        let plan = data || { plan_id: 'free', ai_coach_count: 0, model_papers_count: 0, ai_coach_last_reset: new Date().toISOString(), model_papers_last_reset: new Date().toISOString() };
        
        const now = new Date();
        const coachReset = new Date(plan.ai_coach_last_reset);
        const paperReset = new Date(plan.model_papers_last_reset);
        let updates = {};
        
        // Reset daily limits
        if (now.getDate() !== coachReset.getDate() || now.getMonth() !== coachReset.getMonth() || now.getFullYear() !== coachReset.getFullYear()) {
            plan.ai_coach_count = 0;
            updates.ai_coach_count = 0;
            updates.ai_coach_last_reset = now.toISOString();
        }
        
        // Reset monthly limits
        if (now.getMonth() !== paperReset.getMonth() || now.getFullYear() !== paperReset.getFullYear()) {
            plan.model_papers_count = 0;
            updates.model_papers_count = 0;
            updates.model_papers_last_reset = now.toISOString();
        }
        
        // Check Expiry
        if (plan.plan_expiry && new Date(plan.plan_expiry) < now) {
            plan.plan_id = 'free'; // Expired
            updates.plan_id = 'free';
        }
        
        const isPro = plan.plan_id === 'pro';
        
        if (feature === 'askDoubt') {
            if (!isPro && plan.ai_coach_count >= 5) {
                return res.status(403).json({ error: "You have reached your free daily limit (5/day) for the AI Coach. Upgrade to Scholar PRO for unlimited access!" });
            }
            updates.ai_coach_count = plan.ai_coach_count + 1;
        } else if (feature === 'modelPaper') {
            const limit = isPro ? 30 : 3;
            if (plan.model_papers_count >= limit) {
                return res.status(403).json({ error: `You have reached your monthly limit (${limit}/mo) for Model Papers.${!isPro ? " Upgrade to Scholar PRO for 30 Model Papers!" : ""}` });
            }
            updates.model_papers_count = plan.model_papers_count + 1;
        }
        
        if (data) {
             await supabase.from('user_plans').update(updates).eq('firebase_uid', uid);
        } else {
             await supabase.from('user_plans').insert([{ firebase_uid: uid, ...updates }]);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error("Usage Check Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Get User Plan
app.get('/api/user-plan', async (req, res) => {
    try {
        const uid = req.query.uid;
        if (!uid) return res.status(400).json({ error: "User ID required" });

        const { data, error } = await supabase.from('user_plans').select('*').eq('firebase_uid', uid).single();
        
        let plan = data || { plan_id: 'free' };
        
        // Check Expiry
        if (plan.plan_expiry && new Date(plan.plan_expiry) < new Date()) {
            plan.plan_id = 'free';
        }

        res.json({ success: true, plan: plan.plan_id });
    } catch (error) {
        console.error("Get Plan Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- AI ENDPOINTS ---
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

// Serve Static Files (The Frontend)
app.use(express.static(path.join(__dirname, '../'), { extensions: ['html'] }));

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
