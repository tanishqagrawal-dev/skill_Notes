const fs = require('fs');
const filePath = 'c:/Users/tanis/OneDrive/Desktop/skill_Notes-1/skill_Notes/js/ai-client.js';
let content = fs.readFileSync(filePath, 'utf8');

const SYSTEM_PROMPT = `You are SKiL Coach Pro, an expert engineering mentor. Always give structured, well-formatted answers using markdown. Use **bold** for key terms and headings. Use bullet points or numbered lists to explain concepts point-by-point. Answer ONLY the current question — do NOT add code, programs, or implementations unless the user explicitly asks for code. Use a table ONLY for comparisons (e.g. 'difference between X and Y'). Avoid unnecessary filler. For math, use LaTeX wrapped in $ or $$.`;

const newBlock = `            } else {
                let success = false;
                const SYSTEM_PROMPT = "${SYSTEM_PROMPT.replace(/"/g, '\\"')}";

                // 1. Try Gemini API First
                if (window.GEMINI_KEYS && window.GEMINI_KEYS.length > 0) {
                    const recentContents = window.aiConversationHistory.slice(-6);
                    const contents = recentContents.map(msg => ({
                        role: msg.role === "user" ? "user" : "model",
                        parts: [{ text: msg.text }]
                    }));

                    const payload = {
                        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                        contents: contents
                    };

                    for (let i = 0; i < window.GEMINI_KEYS.length; i++) {
                        const key = window.GEMINI_KEYS[i];
                        try {
                            const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${key}\`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            });

                            const data = await response.json();
                            if (!response.ok) throw new Error(data.error?.message || "Gemini Error");

                            aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || aiReply;
                            success = true;
                            break;
                        } catch (keyError) {
                            console.warn(\`⚠️ Gemini API Failed (Key index: \${i}):\`, keyError.message);
                        }
                    }
                }

                // 2. Fallback to Groq API
                if (!success && window.GROQ_KEYS && window.GROQ_KEYS.length > 0) {
                    for (let i = 0; i < window.GROQ_KEYS.length; i++) {
                        const key = window.GROQ_KEYS[i];
                        try {
                            const recentHistory = window.aiConversationHistory.slice(-6);
                            const groqMessages = recentHistory.map(msg => ({
                                role: msg.role === "user" ? "user" : "assistant",
                                content: msg.text
                            }));
                            groqMessages.unshift({ role: "system", content: SYSTEM_PROMPT });

                            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                                method: "POST",
                                headers: {
                                    "Authorization": \`Bearer \${key}\`,
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
                            break;
                        } catch (keyError) {
                            console.warn(\`⚠️ Groq API Failed (Key index: \${i}):\`, keyError.message);
                        }
                    }
                }

                if (!success) {
                    throw new Error("Traffic limit reached.");
                }`;

// Find the block to replace using a regex
const blockRegex = /\} else \{\r?\n\s+let success = false;[\s\S]*?if \(!success\) \{\r?\n\s+(?:\/\/ Fallback to free if all keys fail\r?\n\s+)?throw new Error\("Traffic limit reached\."\);\r?\n\s+\}/;

if (blockRegex.test(content)) {
    content = content.replace(blockRegex, newBlock);
    fs.writeFileSync(filePath, content);
    console.log('SUCCESS: Swapped to Gemini first, Groq fallback.');
} else {
    console.log('ERROR: Block not found. File unchanged.');
}
