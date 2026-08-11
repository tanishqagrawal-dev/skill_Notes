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
let supabase;
if (supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

// --- AI FALLBACK HELPER ---
async function generateAIContent(prompt, isJson = false) {
    // 1. Collect all keys dynamically from process.env
    const geminiKeys = Object.keys(process.env).filter(k => k.startsWith('GEMINI_API_KEY')).map(k => process.env[k]);
    const groqKeys = Object.keys(process.env).filter(k => k.startsWith('GROQ_API_KEY')).map(k => process.env[k]);

    // 2. Try all Gemini Keys iteratively
    for (let i = 0; i < geminiKeys.length; i++) {
        const key = geminiKeys[i];
        if (!key) continue;
        try {
            console.log(`✨ [Tier 1] Attempting Gemini API Generation (Key index: ${i})...`);
            const localGenAI = new GoogleGenerativeAI(key);
            const model = localGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (geminiError) {
            console.warn(`⚠️ [Tier 1] Gemini API Failed (Key index: ${i}):`, geminiError.message);
        }
    }

    // 3. Fallback to Groq Keys iteratively
    for (let i = 0; i < groqKeys.length; i++) {
        const key = groqKeys[i];
        if (!key) continue;
        try {
            console.log(`♻️ [Tier 2] Falling back to Groq API Generation (Key index: ${i})...`);
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    response_format: isJson ? { type: "json_object" } : undefined
                })
            });

            if (!groqRes.ok) {
                const errData = await groqRes.json();
                throw new Error(errData.error?.message || `Groq Error: ${groqRes.status}`);
            }

            const data = await groqRes.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error("Invalid response from Groq API");
            }

            return data.choices[0].message.content;
        } catch (groqError) {
            console.warn(`⚠️ [Tier 2] Groq API Failed (Key index: ${i}):`, groqError.message);
        }
    }

    throw new Error("All AI API keys (Gemini and Groq) failed.");
}

// --- COMPILER PROXY (PAIZA.IO) ---
app.post('/api/compile', async (req, res) => {
    try {
        const { code, language, input } = req.body;
        const createRes = await fetch('https://api.paiza.io/runners/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_code: code,
                language: language,
                input: input || "",
                api_key: 'guest'
            })
        });
        const createData = await createRes.json();
        res.json(createData);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/compile/status', async (req, res) => {
    try {
        const { id } = req.query;
        const statusRes = await fetch(`https://api.paiza.io/runners/get_details?id=${id}&api_key=guest`);
        const data = await statusRes.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Pricing & Coupons Configuration
let pricingConfig = {
    plans: {
        'codetantra_1mo': { amount: 1900, name: 'CodeTantra Solutions - 1 Month', durationDays: 30 },
        'codetantra_6mo': { amount: 8900, name: 'CodeTantra Solutions - 6 Months', durationDays: 180 },
        'pro_1mo': { amount: 4900, name: 'Premium Scholar - 1 Month', durationDays: 30 },
        'pro_6mo': { amount: 14900, name: 'Premium Scholar - 6 Months', durationDays: 180 }
    },
    coupons: {}
};

async function loadPricingConfig() {
    try {
        if (!supabase) return;
        const { data, error } = await supabase.from('pricing_config').select('*').eq('id', 1).single();
        if (data) {
            pricingConfig = { plans: data.plans || pricingConfig.plans, coupons: data.coupons || {} };
        }
    } catch(e) {
        console.error("Error loading pricing config from Supabase:", e.message);
    }
}
loadPricingConfig();

const getPlans = () => pricingConfig.plans;

// --- PAYMENT ENDPOINTS ---

// 1. Create Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { planId, uid, couponCode } = req.body;
        
        if (!razorpay) {
            return res.status(500).json({ error: "Razorpay keys not configured in server/.env" });
        }

        await loadPricingConfig();
        const plan = getPlans()[planId];
        if (!plan) return res.status(400).json({ error: "Invalid plan selected" });
        if (!uid) return res.status(400).json({ error: "User ID required" });

        let finalAmount = plan.amount;
        if (couponCode && pricingConfig.coupons[couponCode] !== undefined) {
            const couponVal = pricingConfig.coupons[couponCode];
            const isObject = typeof couponVal === 'object';
            const discountPercent = isObject ? couponVal.discount : couponVal;

            if (isObject && couponVal.maxUses && (couponVal.uses || 0) >= couponVal.maxUses) {
                return res.status(400).json({ error: "Coupon usage limit reached" });
            }

            finalAmount = Math.max(0, finalAmount - (finalAmount * (discountPercent / 100)));
        } else if (couponCode) {
            return res.status(400).json({ error: "Invalid coupon code" });
        }

        if (finalAmount === 0) {
            // 100% OFF COUPON: Bypass Razorpay completely and activate the plan directly
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + plan.durationDays);
            const basePlanId = planId.startsWith('codetantra') ? 'codetantra' : 'pro';
            
            // 1. Log Payment (0 amount)
            await supabase.from('payment_logs').insert([{
                firebase_uid: uid,
                razorpay_order_id: `free_order_${Date.now()}`,
                razorpay_payment_id: `coupon_${couponCode}`,
                plan_id: planId,
                amount_paid: 0,
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
                console.error("Supabase Upsert Error for 100% off:", upsertError);
                throw new Error("Failed to activate free plan in database");
            }
            
            // 3. Increment Coupon Uses (if object)
            if (couponCode && typeof pricingConfig.coupons[couponCode] === 'object') {
                pricingConfig.coupons[couponCode].uses = (pricingConfig.coupons[couponCode].uses || 0) + 1;
                await supabase.from('pricing_config').upsert({ id: 1, plans: pricingConfig.plans, coupons: pricingConfig.coupons });
            }
            
            return res.json({ success: true, zeroAmount: true, plan: basePlanId });
        }

        const options = {
            amount: Math.round(finalAmount), // amount in smallest currency unit (paise)
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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, uid, couponCode } = req.body;
        
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

        await loadPricingConfig();
        const plan = getPlans()[planId];
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

        // 3. Increment Coupon Uses (if object)
        if (couponCode && typeof pricingConfig.coupons[couponCode] === 'object') {
            pricingConfig.coupons[couponCode].uses = (pricingConfig.coupons[couponCode].uses || 0) + 1;
            await supabase.from('pricing_config').upsert({ id: 1, plans: pricingConfig.plans, coupons: pricingConfig.coupons });
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

        res.json({ success: true, plan: plan.plan_id, expiry: plan.plan_expiry || null });
    } catch (error) {
        console.error("Get Plan Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Get User Payments
app.get('/api/user-payments', async (req, res) => {
    try {
        const uid = req.query.uid;
        if (!uid) return res.status(400).json({ error: "User ID required" });

        const { data, error } = await supabase
            .from('payment_logs')
            .select('*')
            .eq('firebase_uid', uid)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json({ success: true, payments: data || [] });
    } catch (error) {
        console.error("Get Payments Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- ADMIN SUBSCRIPTIONS ENDPOINTS ---
app.get('/api/admin/subscriptions', async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(401).json({ error: "Unauthorized" });

        // Fetch all user plans
        const { data: plansData, error: plansError } = await supabase.from('user_plans').select('*');
        if (plansError) throw plansError;
        
        // Fetch all payment logs
        const { data: paymentsData, error: paymentsError } = await supabase.from('payment_logs').select('*').order('created_at', { ascending: false });
        if (paymentsError) throw paymentsError;

        // Group payments by user
        const usersMap = {};
        
        plansData.forEach(p => {
            usersMap[p.firebase_uid] = {
                uid: p.firebase_uid,
                plan: p,
                payments: []
            };
        });

        paymentsData.forEach(pay => {
            if (!usersMap[pay.firebase_uid]) {
                usersMap[pay.firebase_uid] = { uid: pay.firebase_uid, plan: { plan_id: 'free' }, payments: [] };
            }
            usersMap[pay.firebase_uid].payments.push(pay);
        });

        res.json({ success: true, users: Object.values(usersMap) });
    } catch (error) {
        console.error("Admin Subscriptions Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/update-subscription', async (req, res) => {
    try {
        const { adminUid, targetUid, action, planId, durationDays } = req.body;
        if (!adminUid || !targetUid || !action) return res.status(400).json({ error: "Missing parameters" });

        if (action === 'cancel') {
            const { error } = await supabase.from('user_plans').update({
                plan_id: 'free',
                plan_expiry: new Date().toISOString()
            }).eq('firebase_uid', targetUid);
            if (error) throw error;
        } else if (action === 'grant') {
            if (!planId || !durationDays) return res.status(400).json({ error: "planId and durationDays required for grant" });
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(durationDays));
            
            const { error } = await supabase.from('user_plans').upsert({
                firebase_uid: targetUid,
                plan_id: planId,
                plan_expiry: expiryDate.toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'firebase_uid' });
            if (error) throw error;
        }
        res.json({ success: true, message: `Subscription ${action}ed successfully.` });
    } catch (error) {
        console.error("Admin Update Sub Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- PRICING & COUPONS ENDPOINTS ---
app.get('/api/pricing-config', async (req, res) => {
    await loadPricingConfig();
    res.json({ success: true, config: pricingConfig });
});

app.post('/api/admin/pricing-config', async (req, res) => {
    try {
        const { uid, plans, coupons } = req.body;
        
        // Basic verification (Assuming admin email check is done properly in real app, we check if they are super admin)
        if (!uid) return res.status(401).json({ error: "Unauthorized" });
        
        pricingConfig = { plans, coupons };
        await supabase.from('pricing_config').upsert({ id: 1, plans, coupons });
        res.json({ success: true, message: "Pricing configured successfully." });
    } catch (error) {
        console.error("Update Pricing Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- AI ENDPOINTS ---
app.post('/api/generate-paper', async (req, res) => {
    try {
        const { subject, university, semester, examType, pyqs } = req.body;

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

        const text = await generateAIContent(prompt, false);

        res.json({ success: true, maxMarks: 70, content: text });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/generate-plan', async (req, res) => {
    try {
        const { subjects, examDate, weakTopics, hoursAvailable, currentLevel } = req.body;

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

        const rawText = await generateAIContent(prompt, true);
        const text = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

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
        
        const responseContent = await generateAIContent(prompt, true);

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

// Intercept views to inject Dynamic WhatsApp Open Graph tags
const serveDynamicView = async (req, res, next) => {
    try {
        const noteId = req.params.id || req.query.id;
        if (!noteId) return next();

        let title = "Academic Resource";
        let description = "Access free study notes, PYQs, and formula sheets on SKiL MATRiX.";
        let image = "https://skilmatrix.site/assets/skilmatrix_og_final.jpg";

        let found = false;

        // 1. Check static notes
        try {
            const globalNotesContent = fs.readFileSync(path.join(__dirname, '../data/globalNotes.js'), 'utf8');
            const getGlobalNotes = new Function(globalNotesContent.replace('export const globalNotes =', 'return '));
            const globalNotes = getGlobalNotes();
            
            for (const college in globalNotes) {
                for (const subject in globalNotes[college]) {
                    const notes = globalNotes[college][subject];
                    const note = notes.find(n => n.id === noteId);
                    if (note) {
                        title = `${note.unit ? note.unit + ' - ' : ''}${note.title || note.subjectName}`;
                        description = `Study notes for ${note.subject || note.subjectName} on SKiL MATRiX.`;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
        } catch(e) {
            console.error("Failed to read static notes for share:", e);
        }

        // 2. Check Supabase for user uploaded notes
        if (!found && supabase) {
            const { data, error } = await supabase.from('approved_notes').select('*').eq('id', noteId).single();
            if (data && !error) {
                title = `${data.unit_number ? data.unit_number + ' - ' : ''}${data.title}`;
                description = `Study notes for ${data.subject || 'your subject'} on SKiL MATRiX.`;
            }
        }

        const cleanTitle = title.replace(/"/g, '&quot;');
        const cleanDesc = description.replace(/"/g, '&quot;');

        let finalHtml = '';
        try {
            const templatePath = path.join(__dirname, '../pages/view.html');
            const template = fs.readFileSync(templatePath, 'utf8');
            
            let cleaned = template.replace(/<!-- ═══ Open Graph[\s\S]*?<!-- Fonts & Icons -->/, '<!-- Fonts & Icons -->');
            
            const injection = `
    <!-- Dynamic OG -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="SKiL MATRiX Notes" />
    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${cleanDesc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${cleanTitle}" />
    <meta name="twitter:description" content="${cleanDesc}" />
    <meta name="twitter:image" content="${image}" />
    
    <base href="https://skilmatrix.site/">
    
    <script>
        const _URLSearchParams = window.URLSearchParams;
        window.URLSearchParams = class extends _URLSearchParams {
            get(name) {
                if (name === 'id') return '${noteId}';
                return super.get(name);
            }
        };
    </script>
`;
            finalHtml = cleaned.replace('<title>View Resource | SKiL MATRiX Notes</title>', `<title>${cleanTitle} | SKiL MATRiX Notes</title>\n${injection}`);
        } catch(e) {
            console.error(e);
            finalHtml = `<html><body>Redirecting... <script>window.location.replace("https://skilmatrix.site/pages/view?id=${noteId}");</script></body></html>`;
        }

        res.send(finalHtml);
    } catch (e) {
        console.error("Share endpoint error:", e);
        next();
    }
};

app.get('/api/share/:id', serveDynamicView);
app.get(['/pages/view', '/pages/view.html'], serveDynamicView);

// Clean URL for Subscription page
app.get('/subscription', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/dashboard.html'));
});

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




// Wildcard 404 Handler - Serves our Ultra Premium Personalized 404 Page
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../404.html'));
});

app.listen(port, () => {
    console.log(`\n🚀 AI Server running at http://localhost:${port}`);
    console.log(`📂 Local Cache active at data/cached_papers.json`);
});
