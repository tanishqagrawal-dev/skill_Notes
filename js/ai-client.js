// AI Client Service (Talks to Firebase Cloud Functions and Gemini API)

// --- FREE AI COACH CONFIGURATION ---
window.GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // Replace with your free Gemini API Key
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

        try {
            if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
                // Free Fallback: Try real-time free AI first, silently fallback to predefined if it fails
                const lowerQ = question.toLowerCase().trim();
                let usePredefined = false;

                // PREDEFINED RESPONSES FIRST
                if (lowerQ.includes("hi") || lowerQ.includes("hello") || lowerQ.includes("hey")) {
                    aiReply = "Hello there! I'm your SKiL Matrix AI Coach PRO. How can I assist you with your engineering studies today?";
                } else if (lowerQ.includes("who are you") || lowerQ.includes("what are you doing") || lowerQ.includes("what are you")) {
                    aiReply = "I am SKiL Matrix AI Coach PRO, an advanced engineering mentor. I'm currently standing by to help you clear your doubts and understand complex concepts.";
                } else if (lowerQ.includes("how are you")) {
                    aiReply = "I'm functioning perfectly and ready to help you learn! What topic are we tackling today?";
                } else if (lowerQ.includes("time complexity of merge sort") || lowerQ.includes("merge sort complexity") || lowerQ.includes("merge sort")) {
                    aiReply = "The time complexity of **Merge Sort is O(n log n)** in all cases (worst, average, and best). \n\nThis is because it recursively divides the array in half at each step (which takes `log n` steps) and then merges the halves by iterating through the `n` elements (taking `O(n)` time).";
                } else if (lowerQ.includes("tcp and udp") || lowerQ.includes("tcp vs udp") || lowerQ.includes("difference between tcp")) {
                    aiReply = "**TCP (Transmission Control Protocol)** is reliable and connection-oriented, meaning it guarantees all packets arrive in order (used for web browsing, emails).\n\n**UDP (User Datagram Protocol)** is faster but connectionless and doesn't guarantee delivery (used for video streaming, gaming).";
                } else if (lowerQ.includes("second highest salary") || lowerQ.includes("2nd highest salary") || (lowerQ.includes("sql query") && lowerQ.includes("salary"))) {
                    aiReply = "To find the second highest salary in SQL, you can use a subquery:\n\n```sql\nSELECT MAX(salary) \nFROM employees \nWHERE salary < (SELECT MAX(salary) FROM employees);\n```\n\nAlternatively, using `LIMIT` (MySQL/PostgreSQL):\n```sql\nSELECT salary \nFROM employees \nORDER BY salary DESC \nLIMIT 1 OFFSET 1;\n```";
                } else if (lowerQ === "what is an api" || lowerQ.includes("explain api") || lowerQ.includes("what is api")) {
                    aiReply = "**API (Application Programming Interface)** acts as a bridge that allows two different software programs to communicate. For example, when a weather app on your phone shows you the forecast, it uses an API to ask the weather service's server for the data, and the server uses the API to send it back.";
                } else if (lowerQ.includes("oop concepts") || lowerQ.includes("object oriented programming")) {
                    aiReply = "The four main pillars of **OOP (Object-Oriented Programming)** are:\n1. **Encapsulation:** Hiding internal state and requiring all interaction to be performed through an object's methods.\n2. **Abstraction:** Hiding complex implementation details and showing only the essential features of the object.\n3. **Inheritance:** Allowing a new class to inherit properties and methods from an existing class.\n4. **Polymorphism:** The ability of different classes to respond to the same method call in their own way.";
                } else if (lowerQ.includes("ai vs ml") || lowerQ.includes("difference between ai and ml") || lowerQ.includes("ai and ml")) {
                    aiReply = "**AI (Artificial Intelligence)** is the broader concept of machines being able to carry out tasks in a way that we would consider 'smart'.\n\n**ML (Machine Learning)** is a current application of AI based around the idea that we should just be able to give machines access to data and let them learn for themselves without explicit programming.";
                } else if (lowerQ.includes("cloud computing") || lowerQ.includes("what is cloud")) {
                    aiReply = "**Cloud Computing** is the delivery of computing services—including servers, storage, databases, networking, software, analytics, and intelligence—over the Internet ('the cloud') to offer faster innovation, flexible resources, and economies of scale. Major providers include AWS, Google Cloud, and Microsoft Azure.";
                } else if (lowerQ.includes("binary search vs linear search") || lowerQ.includes("binary search")) {
                    aiReply = "**Linear Search** checks every element in a list sequentially until a match is found. Time Complexity: `O(n)`.\n\n**Binary Search** requires a *sorted* list. It repeatedly divides the search interval in half. Time Complexity: `O(log n)`.\n\nBinary search is vastly faster for large datasets, but requires the data to be sorted first.";
                } else if (lowerQ.includes("what is a database index") || lowerQ.includes("database index")) {
                    aiReply = "A **Database Index** is a data structure (often a B-Tree) that improves the speed of data retrieval operations on a database table at the cost of additional writes and storage space. Think of it like an index at the back of a book—it helps you find the exact page without reading every single page first.";
                } else {
                    // Try Wikipedia API if no predefined match
                    try {
                        const cleanQuery = question.replace(/^(what is|who is|explain|tell me about|what are|define|how does|what does|write a)\s+/i, '').trim();
                        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=${encodeURIComponent(cleanQuery)}&origin=*`);
                        const searchData = await searchRes.json();
                        
                        if (searchData.query && searchData.query.search.length > 0) {
                            const title = searchData.query.search[0].title;
                            const pageRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=4&exlimit=1&titles=${encodeURIComponent(title)}&explaintext=1&format=json&origin=*`);
                            const pageData = await pageRes.json();
                            const extract = Object.values(pageData.query.pages)[0].extract;
                            
                            if (extract && !extract.toLowerCase().includes("may refer to")) {
                                aiReply = `**${title}**\n\n${extract}`;
                            } else {
                                usePredefined = true;
                            }
                        } else {
                            usePredefined = true;
                        }
                    } catch (e) {
                        usePredefined = true;
                    }
                }

                if (usePredefined) {
                    await new Promise(resolve => setTimeout(resolve, 600));
                    aiReply = "That's a great engineering question! I am currently running in a lightweight local mode. Please try asking about **OOP Concepts**, **API**, **Merge Sort**, **TCP vs UDP**, or **SQL queries**!";
                }
            } else {
                // Gemini API with Google Search
                const systemInstruction = {
                    parts: [{ text: "You are SKiL Coach Pro, an expert engineering mentor. You answer doubts clearly and concisely. You can use Google Search to find current information if needed." }]
                };

                const contents = window.aiConversationHistory.map(msg => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.text }]
                }));

                const payload = {
                    system_instruction: systemInstruction,
                    contents: contents,
                    tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.3 } } }]
                };

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${window.GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error?.message || "Gemini Error");
                
                aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || aiReply;
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
            return "A network error occurred connecting to the AI. Please check your connection and try again.";
        }
    },

    generateModelPaper: async (data) => {
        try {
            const { functions, httpsCallable, db, collection, addDoc, auth, doc, getDoc, updateDoc, increment } = window.firebaseServices;

            if (!functions) throw new Error("Firebase Functions not initialized");
            if (!auth.currentUser) throw new Error("Please login to use AI features.");

            // Check Credits
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();

            const credits = userData?.aiCredits ?? 5;
            if (credits <= 0) {
                throw new Error("You have 0 AI credits left. Upgrade to Pro for unlimited access!");
            }

            const generatePaperFunc = httpsCallable(functions, "generateModelPaper");

            // Format data for the function
            const result = await generatePaperFunc({
                subject: data.subject,
                syllabus: data.syllabus || "Standard University Syllabus",
                pyqs: data.pyqs
            });

            const paperContent = result.data.paper;

            // Save result and decrement
            await addDoc(collection(db, "ai_outputs"), {
                type: "model_paper",
                userId: auth.currentUser.uid,
                subject: data.subject,
                content: paperContent,
                createdAt: new Date()
            });

            await updateDoc(userRef, { aiCredits: increment(-1) });

            return { success: true, content: paperContent };
        } catch (error) {
            console.error("AI Cloud Client Error:", error);
            throw new Error(error.message || "AI generation failed.");
        }
    },

    generateStudyPlan: async (data) => {
        try {
            const { functions, httpsCallable, db, collection, addDoc, auth, doc, getDoc, updateDoc, increment } = window.firebaseServices;

            if (!functions) throw new Error("Firebase Functions not initialized");
            if (!auth.currentUser) throw new Error("Please login to use AI features.");

            // Check Credits
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();

            const credits = userData?.aiCredits ?? 5;
            if (credits <= 0) {
                throw new Error("You have 0 AI credits left. Upgrade to Pro for unlimited AI!");
            }

            const strategistFunc = httpsCallable(functions, "examStrategist");

            const result = await strategistFunc({
                subject: data.subject,
                daysLeft: data.daysLeft || 7,
                weakTopics: data.weakTopics || "Not specified"
            });

            const strategyContent = result.data.strategy;

            // Save and decrement
            await addDoc(collection(db, "ai_outputs"), {
                type: "exam_strategy",
                userId: auth.currentUser.uid,
                subject: data.subject,
                content: strategyContent,
                createdAt: new Date()
            });

            await updateDoc(userRef, { aiCredits: increment(-1) });

            return strategyContent;
        } catch (error) {
            console.error("AI Planner Error:", error);
            throw new Error(error.message || "Failed to generate plan.");
        }
    }
};
