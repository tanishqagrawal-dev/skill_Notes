/**
 * SKiL MATRiX - AI Model Paper Generator
 * Key: 
 */

const AI_LIMIT = 10;

window.AIGenerator = {
    // Check usage
    getUsageCount: async (uid) => {
        const { db, doc, getDoc } = window.firebaseServices || {};
        if (!db) return 0;
        try {
            const usageRef = doc(db, "ai_usage", uid);
            const snap = await getDoc(usageRef);
            return snap.exists() ? snap.data().count : 0;
        } catch (e) {
            console.error("Usage count error:", e);
            return 0;
        }
    },

    // Increment usage
    incrementUsage: async (uid) => {
        const { db, doc, setDoc, increment, serverTimestamp } = window.firebaseServices || {};
        if (!db) return;
        try {
            const usageRef = doc(db, "ai_usage", uid);
            await setDoc(usageRef, {
                count: increment(1),
                lastUsed: serverTimestamp()
            }, { merge: true });
        } catch (e) { console.error(e); }
    },

    // Main paper getter
    getPaper: async (subjectId, subjectName, examType, syllabusContext = "", uid = "guest") => {
        const { db, collection, addDoc, serverTimestamp } = window.firebaseServices || {};
        
        // 1. Try AI Generation with Unit Filtering
        try {
            console.log("✨ SKiL MATRiX AI: Calling Gemini Model...");
            const filteredSyllabus = window.AIGenerator.filterSyllabus(syllabusContext, examType);
            const paper = await window.AIGenerator.callGemini(subjectName, examType, filteredSyllabus);

            // 2. Background Save to Local Backend (Filesystem)
            console.log("💾 Attempting to save paper to local cache...");
            // Force port 3000 if on localhost to match the server.js port
            const saveUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3000/api/save-paper' 
                : '/api/save-paper'; 
            
            fetch(saveUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subjectId, subjectName, examType, content: paper })
            })
            .then(res => res.json())
            .then(data => console.log("✅ Local cache save result:", data))
            .catch(e => console.warn("❌ Local cache save failed. Ensure you are running 'npm start' on port 3000.", e));

            // 3. Background Save to Firebase (if available)
            if (db) {
                addDoc(collection(db, "generated_papers"), {
                    subjectId, subjectName, examType, content: paper, generatedBy: uid, createdAt: serverTimestamp() || new Date()
                }).catch(e => console.warn("Firebase cache save failed:", e));
                window.AIGenerator.incrementUsage(uid).catch(e => {});
            }

            return paper;
        } catch (e) {
            console.error("AI Generation failed, attempting local fallback:", e);
            
            // 4. FALLBACK: Fetch Random Paper from Static Cache or Local Backend
            try {
                // First try direct fetch of the JSON file (Self-Contained Frontend approach)
                console.log("📂 Attempting fallback to static cached papers...");
                
                // Try multiple paths to accommodate different page locations (root vs pages/ directory)
                const possiblePaths = ['./data/cached_papers.json', '../data/cached_papers.json', '../../data/cached_papers.json'];
                let allPapers = null;

                for (const path of possiblePaths) {
                    try {
                        const staticRes = await fetch(path);
                        if (staticRes.ok) {
                            allPapers = await staticRes.json();
                            console.log(`✅ Cache found at: ${path}`);
                            break;
                        }
                    } catch (err) { /* ignore and try next path */ }
                }
                
                if (allPapers) {
                    // Filter by subject and exam type (flexible matching)
                    const matches = allPapers.filter(p => 
                        (p.subjectId?.toLowerCase() === subjectId?.toLowerCase() || 
                         p.subjectName?.toLowerCase() === subjectName?.toLowerCase()) && 
                        p.examType === examType
                    );

                    if (matches.length > 0) {
                        const randomPaper = matches[Math.floor(Math.random() * matches.length)];
                        console.log("♻️ Fallback paper loaded from static cache");
                        return randomPaper.content;
                    } else {
                        console.warn("⚠️ Cache found, but no matching paper for:", subjectName, examType);
                    }
                }

                // Second try: Legacy API (if running with local Node.js server)
                const apiRes = await fetch(`/api/get-random-paper?subjectId=${encodeURIComponent(subjectId)}&examType=${encodeURIComponent(examType)}`);
                if (apiRes.ok) {
                    const data = await apiRes.json();
                    console.log("♻️ Fallback paper loaded from local server API");
                    return data.paper;
                }

                throw new Error("No cached papers found for this subject.");
            } catch (fallbackError) {
                console.error("Fallback failed:", fallbackError);
                throw new Error("AI is offline and no cached papers found for this subject. Please try again later.");
            }
        }
    },

    // Filter syllabus based on exam type
    filterSyllabus: (html, type) => {
        if (!html) return "";
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const units = Array.from(temp.querySelectorAll("h4"));
        const contents = Array.from(temp.querySelectorAll("p"));
        
        let filtered = [];
        units.forEach((u, i) => {
            const title = u.innerText;
            const desc = contents[i] ? contents[i].innerText : "";
            const unitText = `${title}\n${desc}`;
            
            if (type === 'MST 1') {
                if (title.toLowerCase().includes('unit i') || title.toLowerCase().includes('unit ii') || title.toLowerCase().includes('unit 1') || title.toLowerCase().includes('unit 2')) {
                    filtered.push(unitText);
                }
            } else if (type === 'MST 2') {
                if (title.toLowerCase().includes('unit iii') || title.toLowerCase().includes('unit iv') || title.toLowerCase().includes('unit 3') || title.toLowerCase().includes('unit 4')) {
                    filtered.push(unitText);
                }
            } else {
                filtered.push(unitText); // End Sem (All Units)
            }
        });
        
        return filtered.join("\n\n");
    },

    getExactUnitSyllabus: (html, unitNumber) => {
        if (!html) return "";
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const text = temp.innerText || temp.textContent || html;
        
        // Find all matches of Unit headers in the text
        const regex = /\bunit\b\s*[-–: ]*\s*\b(i|ii|iii|iv|v|1|2|3|4|5)\b/gi;
        let matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            const matchedNumText = match[1].toLowerCase();
            let matchedUnitNum = 0;
            if (["1", "i", "one"].includes(matchedNumText)) matchedUnitNum = 1;
            else if (["2", "ii", "two"].includes(matchedNumText)) matchedUnitNum = 2;
            else if (["3", "iii", "three"].includes(matchedNumText)) matchedUnitNum = 3;
            else if (["4", "iv", "four"].includes(matchedNumText)) matchedUnitNum = 4;
            else if (["5", "v", "five"].includes(matchedNumText)) matchedUnitNum = 5;
            
            matches.push({
                index: match.index,
                length: match[0].length,
                unit: matchedUnitNum
            });
        }
        
        // Sort matches by index
        matches.sort((a, b) => a.index - b.index);
        
        // Find the match for the chosen unit number
        const unitMatchIndex = matches.findIndex(m => m.unit === unitNumber);
        if (unitMatchIndex !== -1) {
            const startIdx = matches[unitMatchIndex].index;
            const nextMatch = matches[unitMatchIndex + 1];
            const endIdx = nextMatch ? nextMatch.index : text.length;
            const exactText = text.substring(startIdx, endIdx).trim();
            if (exactText) return exactText;
        }
        
        // Sibling/DOM Fallback:
        let headerElement = null;
        const romanMap = {
            1: ["i", "1", "one"],
            2: ["ii", "2", "two"],
            3: ["iii", "3", "three"],
            4: ["iv", "4", "four"],
            5: ["v", "5", "five"]
        };
        const targets = romanMap[unitNumber] || [];
        for (let el of temp.querySelectorAll("h4, h3, strong, p, div")) {
            const elText = el.innerText.trim().toLowerCase();
            const headingRegex = new RegExp(`\\bunit\\b\\s*[-:]?\\s*\\b(${targets.join("|")})\\b`, "i");
            if (headingRegex.test(elText)) {
                headerElement = el;
                break;
            }
        }
        
        if (headerElement) {
            let content = [headerElement.innerText];
            let sibling = headerElement.nextElementSibling;
            while (sibling) {
                const sibText = sibling.innerText.trim().toLowerCase();
                let isNextHeader = false;
                if (["h3", "h4"].includes(sibling.tagName.toLowerCase())) {
                    isNextHeader = true;
                } else {
                    const unitRegex = /\bunit\b\s*[-:]?\\s*\b(i|ii|iii|iv|v|1|2|3|4|5)\b/i;
                    if (unitRegex.test(sibText)) {
                        isNextHeader = true;
                    }
                }
                
                if (isNextHeader) break;
                
                content.push(sibling.innerText);
                sibling = sibling.nextElementSibling;
            }
            return content.join("\n").trim();
        }
        
        const h4s = Array.from(temp.querySelectorAll("h4"));
        const ps = Array.from(temp.querySelectorAll("p"));
        if (h4s.length > 0) {
            let foundIdx = -1;
            h4s.forEach((h, idx) => {
                const hText = h.innerText.toLowerCase();
                const headingRegex = new RegExp(`\\bunit\\b\\s*[-:]?\\s*\\b(${targets.join("|")})\\b`, "i");
                if (headingRegex.test(hText)) {
                    foundIdx = idx;
                }
            });
            if (foundIdx !== -1) {
                const title = h4s[foundIdx].innerText;
                const desc = ps[foundIdx] ? ps[foundIdx].innerText : "";
                return `${title}\n${desc}`;
            }
        }
        
        return text.trim();
    },

    callGemini: async (subject, type, syllabus) => {
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

        let responseContent = null;

        // These placeholders will be replaced by actual keys during `npm run build`
        let geminiKey = "INJECT_GEMINI_API_KEY" && !"INJECT_GEMINI_API_KEY".includes("INJECT_") ? "INJECT_GEMINI_API_KEY".split("").reverse().join("") : "INJECT_GEMINI_API_KEY";
        let groqKey = "INJECT_GROQ_API_KEY" && !"INJECT_GROQ_API_KEY".includes("INJECT_") ? "INJECT_GROQ_API_KEY".split("").reverse().join("") : "INJECT_GROQ_API_KEY";
        
        let geminiKeys = [geminiKey];
        let groqKeys = [groqKey];

        // If running locally without build, attempt to fetch keys from the backend API or reuse window keys
        if (geminiKey.includes("INJECT")) {
            if (window.GEMINI_KEYS && window.GEMINI_KEYS.length > 0) {
                geminiKeys = window.GEMINI_KEYS;
            }
            if (window.GROQ_KEYS && window.GROQ_KEYS.length > 0) {
                groqKeys = window.GROQ_KEYS;
            }

            if (geminiKeys.some(k => k.includes("INJECT")) || geminiKeys.length === 0 || geminiKeys[0] === "INJECT_GEMINI_API_KEY") {
                try {
                    const apiKeysRes = await fetch('/api/get-ai-keys');
                    if (apiKeysRes.ok) {
                        const keysData = await apiKeysRes.json();
                        if (keysData.gemini && keysData.gemini.length > 0) geminiKeys = keysData.gemini;
                        if (keysData.groq && keysData.groq.length > 0) groqKeys = keysData.groq;
                    }
                } catch (e) {
                    console.warn("Local API keys fetch failed.");
                }
            }
        }

        // 1. Tier 1: Try Gemini
        for (let i = 0; i < geminiKeys.length; i++) {
            const key = geminiKeys[i];
            if (!key || key.includes("INJECT")) continue;
            
            try {
                console.log(`✨ [Tier 1] Attempting Gemini API Generation (Key index: ${i})...`);
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (!res.ok) throw new Error("Gemini API Error");
                const data = await res.json();
                responseContent = data.candidates[0].content.parts[0].text;
                break; // Success!
            } catch (e) {
                console.warn(`⚠️ [Tier 1] Gemini API Failed (Key index: ${i}):`, e.message);
            }
        }

        // 2. Tier 2: Try Groq
        if (!responseContent) {
            for (let i = 0; i < groqKeys.length; i++) {
                const key = groqKeys[i];
                if (!key || key.includes("INJECT")) continue;
                
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
                            response_format: { type: "json_object" }
                        })
                    });

                    if (!groqRes.ok) throw new Error(`Groq Error: ${groqRes.status}`);
                    const data = await groqRes.json();
                    responseContent = data.choices[0].message.content;
                    break; // Success!
                } catch (e) {
                    console.warn(`⚠️ [Tier 2] Groq API Failed (Key index: ${i}):`, e.message);
                }
            }
        }

        if (!responseContent) {
            console.error("❌ Both AI Generations Failed for all keys.");
            throw new Error("AI Paper Generation Failed"); // This triggers Tier 3 (Local Cache)
        }
        
        const cleanedText = responseContent.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText);
    },

    renderPaperHTML: (paper) => {
        const today = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        return `
        <div class="exam-container" id="printable-paper" style="background: white; color: black; padding: 4rem; font-family: 'Times New Roman', Times, serif; position: relative; width: 210mm; margin: auto; line-height: 1.4; box-shadow: 0 0 10px rgba(0,0,0,0.1); box-sizing: border-box;">
            
            <style>
                .exam-container { 
                    position: relative; 
                    background-color: white;
                }
                /* Robust repeating watermark for multi-page PDF */
                .exam-container::before {
                    content: "";
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' opacity='0.08'><text x='50%' y='50%' text-anchor='middle' fill='black' font-size='40' font-family='sans-serif' transform='rotate(-45 200,200)' font-weight='900'>SKiL MATRiX</text></svg>");
                    background-repeat: repeat;
                    opacity: 1;
                    pointer-events: none;
                    z-index: 0;
                }
                .section-header-pro { page-break-before: auto; page-break-after: avoid; }
                /* Avoid breaking small blocks, but allow breaking large questions to prevent huge gaps */
                .question-block-pro { page-break-inside: auto; margin-bottom: 20px; position: relative; z-index: 1; }
                .sub-question-row { page-break-inside: avoid; display: flex; margin-bottom: 8px; }
            </style>

            <!-- Top Header Extras -->
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: bold; position: relative; z-index: 1;">
                <div>No. of Questions: ${paper.sections.reduce((acc, s) => acc + s.questions.length, 0)}</div>
                <div>Enrollment No. ________________</div>
            </div>

            <!-- Header Section -->
            <div style="display: flex; align-items: center; margin-bottom: 1rem; position: relative; z-index: 1; border-bottom: 1px solid #000; padding-bottom: 10px;">
                <div style="flex: 0 0 100px;">
                    <img src="../assets/logo.jpg?v=7.0" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;">
                </div>
                <div style="flex: 1; text-align: center;">
                    <h2 style="margin: 0; font-size: 1.3rem; font-weight: bold; text-transform: uppercase;">Faculty of Engineering</h2>
                    <h3 style="margin: 3px 0; font-size: 1.2rem; font-weight: bold;">${paper.examTitle} Examination ${today}</h3>
                    <h3 style="margin: 3px 0; font-size: 1.1rem; font-weight: bold;">${paper.subjectCode || 'SKL2026'} / ${paper.subjectName}</h3>
                    <div style="font-weight: bold;">(T)</div>
                </div>
            </div>

            <!-- Metadata Grid -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; border-bottom: 2px solid black; padding: 5px 0; margin-bottom: 1rem; font-size: 0.95rem; position: relative; z-index: 1; font-weight: bold;">
                <div>
                    <div>Programme: B.Tech. / B.Sc.</div>
                    <div>Duration: ${paper.examTitle.includes('MST') ? '1 Hour' : '3 Hours'}</div>
                </div>
                <div>
                    <div>Branch/Specialization: CSE</div>
                    <div>Maximum Marks: ${paper.examTitle.includes('MST') ? '20' : '60'}</div>
                </div>
            </div>

            <div style="font-size: 0.85rem; line-height: 1.4; margin-bottom: 1.5rem; position: relative; z-index: 1; padding: 10px; border: 1px dashed #ccc; background: rgba(0,0,0,0.02);">
                <b>Note:</b> This is an AI-generated sample paper by <b>SKiL MATRiX</b> for practice purposes only. It is not an official university question paper. Do not misuse or distribute this as an original document. Assume suitable data if necessary.
            </div>

            <!-- Question Sections -->
            <div class="sections-content" style="position: relative; z-index: 1;">
                ${paper.sections.map((s, sIdx) => `
                    <div class="section-header-pro" style="margin-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 12px;">
                            <h4 style="margin: 0; font-size: 1.05rem; font-weight: 900; text-transform: uppercase;">${s.title} (Answer all question(s))</h4>
                            <div style="font-size: 0.8rem; font-weight: bold; display: flex; gap: 12px; text-align: center;">
                                <div style="width: 35px;">Marks</div>
                                <div style="width: 25px;">BL</div>
                                <div style="width: 25px;">CO</div>
                                <div style="width: 25px;">PO</div>
                                <div style="width: 30px;">PSO</div>
                            </div>
                        </div>
                        
                        ${s.questions.map((q, qIdx) => `
                            <!-- Main Question Block -->
                            <div class="question-block-pro" style="display: flex; font-size: 0.98rem;">
                                <div style="flex: 0 0 45px; font-weight: bold;">Q.${q.id}</div>
                                <div style="flex: 1;">
                                    ${q.subQuestions ? q.subQuestions.map(sq => `
                                        <div class="sub-question-row">
                                            <div style="flex: 0 0 25px;">${sq.id}.</div>
                                            <div style="flex: 1; padding-right: 10px;">
                                                <div>${sq.text}</div>
                                                ${sq.options ? `
                                                    <div style="display: grid; grid-template-columns: 1fr 1fr; margin-top: 5px; font-size: 0.9rem;">
                                                        ${sq.options.map(opt => `<div>${opt}</div>`).join('')}
                                                    </div>
                                                ` : ''}
                                            </div>
                                            <div style="flex: 0 0 160px; display: flex; gap: 12px; justify-content: flex-end; font-weight: bold; text-align: center; font-size: 0.85rem;">
                                                <div style="width: 35px;">${sq.marks || '2'}</div>
                                                <div style="width: 25px;">${sq.bl || '01'}</div>
                                                <div style="width: 25px;">${sq.co || '01'}</div>
                                                <div style="width: 25px;">${sq.po || '1'}</div>
                                                <div style="width: 30px;">${sq.pso || '1'}</div>
                                            </div>
                                        </div>
                                    `).join('') : `
                                        <div class="sub-question-row">
                                            <div style="flex: 1; padding-right: 10px;">${q.text || ''}</div>
                                            <div style="flex: 0 0 160px; display: flex; gap: 12px; justify-content: flex-end; font-weight: bold; text-align: center; font-size: 0.85rem;">
                                                <div style="width: 35px;">${q.marks || '10'}</div>
                                                <div style="width: 25px;">${q.bl || '01'}</div>
                                                <div style="width: 25px;">${q.co || '01'}</div>
                                                <div style="width: 25px;">${q.po || '1'}</div>
                                                <div style="width: 30px;">${q.pso || '1'}</div>
                                            </div>
                                        </div>
                                    `}
                                    
                                    ${q.orQuestion ? `
                                        <div style="text-align: center; font-weight: bold; margin: 12px 0; font-size: 0.9rem; page-break-inside: avoid;">(OR)</div>
                                        <div style="display: flex; page-break-inside: avoid;">
                                            <div style="flex: 0 0 40px; font-weight: bold;">${paper.examTitle.includes('MST') ? 'iv.' : 'b.'}</div>
                                            <div style="flex: 1; padding-right: 10px;">${q.orQuestion.text || ''}</div>
                                            <div style="flex: 0 0 160px; display: flex; gap: 12px; justify-content: flex-end; font-weight: bold; text-align: center; font-size: 0.85rem;">
                                                <div style="width: 35px;">${q.orQuestion.marks || '10'}</div>
                                                <div style="width: 25px;">${q.orQuestion.bl || '01'}</div>
                                                <div style="width: 25px;">${q.orQuestion.co || '01'}</div>
                                                <div style="width: 25px;">${q.orQuestion.po || '1'}</div>
                                                <div style="width: 30px;">${q.orQuestion.pso || '1'}</div>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>

            <div style="text-align: center; margin-top: 3rem; font-weight: bold; font-size: 1rem; letter-spacing: 5px; page-break-inside: avoid;">
                ******
            </div>
            
            <div style="position: absolute; bottom: 2rem; width: calc(100% - 8rem); text-align: right; font-size: 0.75rem; color: #666; font-style: italic;">
                For more resources visit <a href="https://skilmatrix.site/" style="color: #666; text-decoration: none;">skilmatrix.site</a>
            </div>
        </div>
        `;
    },

    downloadAsPDF: (paperHTML, fileName) => {
        const opt = {
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Use html2pdf if available
        if (window.html2pdf) {
            const container = document.createElement("div");
            container.innerHTML = paperHTML;
            document.body.appendChild(container); // Temporarily add to DOM for rendering
            window.html2pdf().from(container).set(opt).save().then(() => {
                document.body.removeChild(container);
            });
        } else {
            // Load and run
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = () => window.AIGenerator.downloadAsPDF(paperHTML, fileName);
            document.head.appendChild(script);
        }
    },

    getSummary: async (subjectName, summaryType, syllabusText, unitNumber) => {
        let geminiKey = "INJECT_GEMINI_API_KEY" && !"INJECT_GEMINI_API_KEY".includes("INJECT_") ? "INJECT_GEMINI_API_KEY".split("").reverse().join("") : "INJECT_GEMINI_API_KEY";
        let groqKey = "INJECT_GROQ_API_KEY" && !"INJECT_GROQ_API_KEY".includes("INJECT_") ? "INJECT_GROQ_API_KEY".split("").reverse().join("") : "INJECT_GROQ_API_KEY";
        
        let geminiKeys = [geminiKey];
        let groqKeys = [groqKey];
        
        if (geminiKey.includes("INJECT")) {
            if (window.GEMINI_KEYS && window.GEMINI_KEYS.length > 0) {
                geminiKeys = window.GEMINI_KEYS;
            }
            if (window.GROQ_KEYS && window.GROQ_KEYS.length > 0) {
                groqKeys = window.GROQ_KEYS;
            }
            if (geminiKeys.some(k => k.includes("INJECT")) || geminiKeys.length === 0 || geminiKeys[0] === "INJECT_GEMINI_API_KEY") {
                try {
                    const apiKeysRes = await fetch('/api/get-ai-keys');
                    if (apiKeysRes.ok) {
                        const keysData = await apiKeysRes.json();
                        if (keysData.gemini && keysData.gemini.length > 0) geminiKeys = keysData.gemini;
                        if (keysData.groq && keysData.groq.length > 0) groqKeys = keysData.groq;
                    }
                } catch (e) {
                    console.warn("Local API keys fetch failed.");
                }
            }
        }

        let cleanSyllabus = "";
        if (summaryType === 'single-unit' && unitNumber) {
            cleanSyllabus = window.AIGenerator.getExactUnitSyllabus(syllabusText, unitNumber);
            if (!cleanSyllabus) {
                cleanSyllabus = syllabusText ? syllabusText.replace(/<[^>]*>?/gm, '').trim() : "Official university curriculum";
            }
        } else {
            cleanSyllabus = syllabusText ? syllabusText.replace(/<[^>]*>?/gm, '').trim() : "Official university curriculum";
        }

        let prompt = "";
        if (summaryType === 'single-unit' && unitNumber) {
            prompt = `You are a world-class academic tutor. Create a highly structured, concise, and systematic Concept Revision Summary for ONLY Unit ${unitNumber} of the subject "${subjectName}" based on the following syllabus context:
            
            Syllabus:
            ${cleanSyllabus}
            
            Guidelines:
            1. Focus strictly, exclusively, and only on the topics belonging to Unit ${unitNumber} explicitly listed in the Syllabus block above.
            2. STRICT CRITICAL REQUIREMENT: You must NOT include, explain, or define topics (such as Turing Test, Intelligent Agents, PEAS framework, or Agent Architectures) unless they are explicitly written inside the "Syllabus" text provided above. If a topic is not mentioned in the provided Syllabus text, you MUST NOT include it in the summary. Focus only on summarizing the exact topics provided (e.g. if BFS/DFS are listed, explain BFS/DFS; if Production Systems are listed, explain Production Systems).
            3. Keep the summary extremely concise, crisp, and high-yield. Explain every concept in at most 1-2 brief, direct sentences. Avoid long descriptions or wordy explanations.
            4. Structure the summary topic-by-topic matching the syllabus units. Use clear, bold headings for each sub-topic.
            5. Explain concepts point-by-point with bold terminology prefixes (e.g., "- **Production System**: A structure that..."). Do NOT use paragraphs.
            6. Highlight formal definitions of core terms inside blockquotes (e.g., "> **Definition - [Term]**: [Definition text]").
            7. Use comparison tables to summarize parameters, algorithms, or theories. Keep columns clean.
            8. Do NOT generate any ASCII/text flowcharts, diagrams, or boxes to avoid mobile/screen overflow issues.
            9. Include key mathematical formulas, algorithms, or equations if applicable. Make sure equations are written on separate lines.
            10. The output must be structured for rapid, efficient student revision before examinations. Use extremely clean, premium Markdown formatting. No raw HTML.
            11. Do NOT include any topics or definitions from other units or outside the provided Syllabus context. Your summary must match ONLY the topics listed in the Syllabus context above.`;
        } else {
            prompt = `You are a world-class academic tutor. Create a highly structured, concise, and systematic Unit-Wise Concept Revision Summary for the subject "${subjectName}" based on the following syllabus context:
            
            Syllabus:
            ${cleanSyllabus}
            
            Guidelines:
            1. Divide the summary clearly by units found in the syllabus (e.g., Unit 1, Unit 2, Unit 3, etc.).
            2. Focus strictly, exclusively, and only on the topics explicitly listed in the Syllabus block above.
            3. STRICT CRITICAL REQUIREMENT: You must NOT include, explain, or define topics (such as Turing Test, Intelligent Agents, PEAS framework, or Agent Architectures) unless they are explicitly written inside the "Syllabus" text provided above. If a topic is not mentioned in the provided Syllabus text, you MUST NOT include it in the summary.
            4. Keep the summary extremely concise, crisp, and high-yield. Explain every concept in at most 1-2 brief, direct sentences. Avoid long descriptions or wordy explanations.
            5. For EACH unit, structure the summary topic-by-topic matching the syllabus topics. Use clear, bold headings for each sub-topic.
            6. Explain concepts point-by-point with bold terminology prefixes. Do NOT use paragraphs.
            7. Highlight formal definitions of core terms inside blockquotes (e.g., "> **Definition - [Term]**: [Definition text]").
            8. Use comparison tables to summarize parameters, algorithms, or theories. Keep columns clean.
            9. Do NOT generate any ASCII/text flowcharts, diagrams, or boxes to avoid mobile/screen overflow issues.
            10. Include key mathematical formulas, algorithms, or equations if applicable. Make sure equations are written on separate lines.
            11. The output must be structured for rapid, efficient student revision before examinations. Use extremely clean, premium Markdown formatting. No raw HTML.
            12. Do NOT include any topics or definitions from other units or outside the provided Syllabus context. Your summary must match ONLY the topics listed in the Syllabus context above.`;
        }

        let responseContent = null;

        // Tier 1: Try Gemini
        for (let i = 0; i < geminiKeys.length; i++) {
            const key = geminiKeys[i];
            if (!key || key.includes("INJECT")) continue;
            
            try {
                console.log(`✨ [Summary] Attempting Gemini API (Key index: ${i})...`);
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (!res.ok) throw new Error("Gemini API Error");
                const data = await res.json();
                responseContent = data.candidates[0].content.parts[0].text;
                break;
            } catch (e) {
                console.warn(`⚠️ [Summary] Gemini failed (Key index: ${i}):`, e.message);
            }
        }

        // Tier 2: Try Groq
        if (!responseContent) {
            for (let i = 0; i < groqKeys.length; i++) {
                const key = groqKeys[i];
                if (!key || key.includes("INJECT")) continue;
                
                try {
                    console.log(`♻️ [Summary] Falling back to Groq API (Key index: ${i})...`);
                    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${key}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "llama-3.3-70b-versatile",
                            messages: [{ role: "user", content: prompt }]
                        })
                    });

                    if (!groqRes.ok) throw new Error(`Groq Error: ${groqRes.status}`);
                    const data = await groqRes.json();
                    responseContent = data.choices[0].message.content;
                    break;
                } catch (e) {
                    console.warn(`⚠️ [Summary] Groq failed (Key index: ${i}):`, e.message);
                }
            }
        }

        if (!responseContent) {
            throw new Error("AI Summary Generation Failed. Please try again.");
        }

        return responseContent;
    }
};
