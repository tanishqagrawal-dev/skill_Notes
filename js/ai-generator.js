/**
 * SKiL MATRiX - AI Model Paper Generator
 * Key: 
 */

const AI_LIMIT = 10;
window.GEMINI_API_KEY = "AIzaSyAKgqGl4bFlZUgokFcJkVgTSN0BshQ4pag";
/**window.GEMINI_API_KEY = "AIzaSyCGPMynTaRKkIqO8spgE0LBmTQkRS_SbHI";*/

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
            
            // 4. FALLBACK: Fetch Random Paper from Local Backend
            try {
                const res = await fetch(`/api/get-random-paper?subjectId=${encodeURIComponent(subjectId)}&examType=${encodeURIComponent(examType)}`);
                if (!res.ok) throw new Error("No fallback available");
                const data = await res.json();
                console.log("♻️ Fallback paper loaded from local cache");
                return data.paper;
            } catch (fallbackError) {
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

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${window.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error?.message || `API Error: ${res.status}`);
            }

            const data = await res.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error("Invalid API Response:", data);
                throw new Error("The AI returned an invalid response. Please check your API key.");
            }

            const text = data.candidates[0].content.parts[0].text;
            const cleanedText = text.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error("Gemini Error:", e);
            throw new Error(e.message.includes("API key not valid") ? "The API key you provided is invalid. Please use a valid Google AI Studio key." : e.message);
        }
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
                    <img src="../assets/logo.jpg" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;">
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
                For more resources visit <a href="https://skillnotes.netlify.app/" style="color: #666; text-decoration: none;">skillnotes.netlify.app</a>
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
    }
};
