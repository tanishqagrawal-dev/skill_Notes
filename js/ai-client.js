// AI Client Service (Talks to Firebase Cloud Functions and Gemini API)

// --- FREE AI COACH CONFIGURATION ---
window.GEMINI_API_KEY = "INJECT_GEMINI_API_KEY";
window.GROQ_API_KEY = "INJECT_GROQ_API_KEY";
window.aiConversationHistory = []; // Stores the chat context

window.aiClient = {
    isServerAvailable: async () => {
        // Since we are using Cloud Functions, they are always "available" if the internet is up
        return true;
    },

    askDoubt: async (question) => {
        // Add user message to history
        window.aiConversationHistory.push({ role: "user", text: question });

        let aiReply = "I couldn't generate a response.";

        const lowerQ = question.toLowerCase().trim();
        let predefinedAnswer = null;

        if (lowerQ === "hi" || lowerQ === "hii" || lowerQ.includes("hello") || lowerQ === "hey" || lowerQ.includes("good morning") || lowerQ.includes("good evening") || lowerQ.includes("good afternoon")) {
            predefinedAnswer = "Hello there! I'm your SKiL Matrix AI Coach PRO. How can I assist you with your engineering studies today?";
        } else if (lowerQ.includes("who are you") || lowerQ.includes("what are you doing") || lowerQ.includes("what are you")) {
            predefinedAnswer = "I am SKiL Matrix AI Coach PRO, an advanced engineering mentor. I'm currently standing by to help you clear your doubts and understand complex concepts.";
        } else if (lowerQ.includes("how are you")) {
            predefinedAnswer = "I'm functioning perfectly and ready to help you learn! What topic are we tackling today?";
        } else if (lowerQ.includes("what can you do") || lowerQ.includes("help") || lowerQ.includes("your capabilities")) {
            predefinedAnswer = "I can help you understand engineering concepts, explain complex algorithms, generate study plans, and provide model past-year question (PYQ) papers. Just ask me a question!";
        } else if (lowerQ.includes("thank you") || lowerQ.includes("thanks") || lowerQ === "ty") {
            predefinedAnswer = "You're very welcome! If you have any more questions, feel free to ask. Happy learning!";
        } else if (lowerQ.includes("who created you") || lowerQ.includes("who made you") || lowerQ.includes("your creator") || lowerQ.includes("who is your developer") || lowerQ.includes("who programmed you")) {
            predefinedAnswer = "I was developed and programmed by **Tanishq Agrawal** to serve as an intelligent, responsive engineering mentor and study companion for the SKiL Matrix platform.";
        } else if (lowerQ.includes("are you a robot") || lowerQ.includes("are you human") || lowerQ.includes("are you an ai")) {
            predefinedAnswer = "I am an AI, specifically designed by the **SKiL Matrix Team** to act as a 24/7 personal engineering mentor!";
        } else if (lowerQ.includes("skil matrix") || lowerQ.includes("what is skil matrix") || lowerQ.includes("about skil matrix")) {
            predefinedAnswer = "**SKiL Matrix** is an advanced educational platform designed by the **SKiL Matrix Team** to streamline your academic journey. It features comprehensive notes sharing, an intelligent AI Coaching system, attendance tracking, and competitive coding arenas to help students excel in engineering!";
        } else if (lowerQ.includes("founder of skil matrix") || lowerQ.includes("founders of skil matrix") || lowerQ.includes("who are the founders") || lowerQ.includes("who is the founder")) {
            predefinedAnswer = "The founders of the SKiL Matrix platform are **Tanishq Agrawal**, **Yash Jain**, and **Anoop Verma**.";
        } else if (lowerQ.includes("bye") || lowerQ.includes("goodbye") || lowerQ.includes("see you")) {
            predefinedAnswer = "Goodbye! Keep up the great work with your studies, and I'll be here whenever you need me.";
        } else if (lowerQ.includes("joke") || lowerQ.includes("funny")) {
            predefinedAnswer = "Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛😄\nNow, how can I help you with your studies?";
        }

        if (predefinedAnswer) {
            window.aiConversationHistory.push({ role: "model", text: predefinedAnswer });
            if (window.aiConversationHistory.length > 20) {
                window.aiConversationHistory = window.aiConversationHistory.slice(-20);
            }
            return predefinedAnswer;
        }


        try {
            if (window.auth && window.auth.currentUser) {
                const uid = window.auth.currentUser.uid;
                const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
                const limitRes = await fetch(`${apiUrl}/api/use-feature`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid, feature: 'askDoubt' })
                });
                
                if (!limitRes.ok) {
                    const errorData = await limitRes.json();
                    throw new Error(errorData.error || "Limit reached");
                }
            } else {
                throw new Error("Please login to use the AI Coach.");
            }

            // Populate window.GEMINI_KEYS and window.GROQ_KEYS dynamically from the backend
            if (!window.GEMINI_KEYS || !window.GROQ_KEYS) {
                window.GEMINI_KEYS = [];
                window.GROQ_KEYS = [];
                try {
                    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
                    const envRes = await fetch(`${apiUrl}/api/get-ai-keys`);
                    if (envRes.ok) {
                        const keysData = await envRes.json();
                        if (keysData.gemini && keysData.gemini.length > 0) {
                            window.GEMINI_KEYS = keysData.gemini;
                        }
                        if (keysData.groq && keysData.groq.length > 0) {
                            window.GROQ_KEYS = keysData.groq;
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch AI keys dynamically from the server.");
                }
                
                if (window.GEMINI_KEYS.length === 0 && window.GEMINI_API_KEY && !window.GEMINI_API_KEY.includes("INJECT")) {
                    window.GEMINI_KEYS = [window.GEMINI_API_KEY];
                }
                if (window.GROQ_KEYS.length === 0 && window.GROQ_API_KEY && !window.GROQ_API_KEY.includes("INJECT")) {
                    window.GROQ_KEYS = [window.GROQ_API_KEY];
                }
            }

            if ((!window.GEMINI_KEYS || window.GEMINI_KEYS.length === 0) && (!window.GROQ_KEYS || window.GROQ_KEYS.length === 0)) {
                // Free Fallback: Try real-time free AI first, silently fallback to predefined if it fails
                // Removed predefined block to top
            } else {
                let success = false;

                // 1. Try Groq API First
                if (window.GROQ_KEYS && window.GROQ_KEYS.length > 0) {
                    for (let i = 0; i < window.GROQ_KEYS.length; i++) {
                        const key = window.GROQ_KEYS[i];
                        try {
                            const recentHistory = window.aiConversationHistory.slice(-6);
                            const groqMessages = recentHistory.map(msg => ({
                                role: msg.role === "user" ? "user" : "assistant",
                                content: msg.text
                            }));
                            groqMessages.unshift({ role: "system", content: "You are SKiL Coach Pro, an expert engineering mentor. Always give structured, well-formatted answers using markdown. Use **bold** for key terms and headings. Use bullet points or numbered lists to explain concepts point-by-point. Answer ONLY the current question — do NOT add code, programs, or implementations unless the user explicitly asks for code. Use a table ONLY for comparisons (e.g. 'difference between X and Y'). Avoid unnecessary filler. For math, use LaTeX wrapped in $ or $$." });
                            
                            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${key}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    model: "openai/gpt-oss-120b",
                                    messages: groqMessages
                                })
                            });

                            if (!response.ok) throw new Error("Groq API Error");
                            const data = await response.json();
                            aiReply = data.choices[0].message.content || aiReply;
                            success = true;
                            break; // Success! Break the retry loop
                        } catch (keyError) {
                            console.warn(`⚠️ Groq API Failed (Key index: ${i}):`, keyError.message);
                        }
                    }
                }

                // 2. Fallback to Gemini API
                if (!success && window.GEMINI_KEYS && window.GEMINI_KEYS.length > 0) {
                    const systemInstruction = {
                        parts: [{ text: "You are SKiL Coach Pro, an expert engineering mentor. Always give structured, well-formatted answers using markdown. Use **bold** for key terms and headings. Use bullet points or numbered lists to explain concepts point-by-point. Answer ONLY the current question — do NOT add code, programs, or implementations unless the user explicitly asks for code. Use a table ONLY for comparisons (e.g. 'difference between X and Y'). Avoid unnecessary filler. For math, use LaTeX wrapped in $ or $$." }]
                    };

                    const recentContents = window.aiConversationHistory.slice(-6);
                    const contents = recentContents.map(msg => ({
                        role: msg.role === "user" ? "user" : "model",
                        parts: [{ text: msg.text }]
                    }));

                    const payload = {
                        system_instruction: systemInstruction,
                        contents: contents
                    };

                    for (let i = 0; i < window.GEMINI_KEYS.length; i++) {
                        const key = window.GEMINI_KEYS[i];
                        try {
                            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            });

                            const data = await response.json();
                            if (!response.ok) throw new Error(data.error?.message || "Gemini Error");
                            
                            aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || aiReply;
                            success = true;
                            break; // Success! Break the retry loop
                        } catch (keyError) {
                            console.warn(`⚠️ Gemini API Failed (Key index: ${i}):`, keyError.message);
                        }
                    }
                }
                
                if (!success) {
                    // Fallback to free if all keys fail
                    throw new Error("Traffic limit reached.");
                }
            }

            // Save AI response to history
            window.aiConversationHistory.push({ role: "model", text: aiReply });
            if (window.aiConversationHistory.length > 20) {
                window.aiConversationHistory = window.aiConversationHistory.slice(-20);
            }
            return aiReply;

        } catch (error) {
            console.error("AI Client Request Failed:", error);
            window.aiConversationHistory.pop(); // Remove the user message
            return "Our AI servers are currently experiencing unusually high traffic. Please try asking your question again in a few moments!";
        }
    },

    generateModelPaper: async (data) => {
        try {
            const { functions, httpsCallable, db, collection, addDoc, auth } = window.firebaseServices;

            if (!functions) throw new Error("Firebase Functions not initialized");
            if (!auth.currentUser) throw new Error("Please login to use AI features.");

            const uid = auth.currentUser.uid;

            // Check and Consume Credit via Backend
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
            const limitRes = await fetch(`${apiUrl}/api/use-feature`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, feature: 'modelPaper' })
            });

            if (!limitRes.ok) {
                const errorData = await limitRes.json();
                throw new Error(errorData.error || "You have reached your limit for Model Papers.");
            }

            const generatePaperFunc = httpsCallable(functions, "generateModelPaper");

            // Format data for the function
            const result = await generatePaperFunc({
                subject: data.subject,
                syllabus: data.syllabus || "Standard University Syllabus",
                pyqs: data.pyqs
            });

            const paperContent = result.data.paper;

            // Save result
            await addDoc(collection(db, "ai_outputs"), {
                type: "model_paper",
                userId: uid,
                subject: data.subject,
                content: paperContent,
                createdAt: new Date()
            });

            return { success: true, content: paperContent };
        } catch (error) {
            console.error("AI Cloud Client Error:", error);
            throw new Error(error.message || "AI generation failed.");
        }
    },

    generateStudyPlan: async (data) => {
        try {
            const { functions, httpsCallable, db, collection, addDoc, auth } = window.firebaseServices;

            if (!functions) throw new Error("Firebase Functions not initialized");
            if (!auth.currentUser) throw new Error("Please login to use AI features.");

            // AI Study Plan is now FREE and UNLIMITED, so no credit check here.

            const strategistFunc = httpsCallable(functions, "examStrategist");

            const result = await strategistFunc({
                subject: data.subject,
                daysLeft: data.daysLeft || 7,
                weakTopics: data.weakTopics || "Not specified"
            });

            const strategyContent = result.data.strategy;

            // Save
            await addDoc(collection(db, "ai_outputs"), {
                type: "exam_strategy",
                userId: auth.currentUser.uid,
                subject: data.subject,
                content: strategyContent,
                createdAt: new Date()
            });

            return strategyContent;
        } catch (error) {
            console.error("AI Planner Error:", error);
            throw new Error("Our servers are currently experiencing high traffic. Please try again in a few minutes.");
        }
    }
};
