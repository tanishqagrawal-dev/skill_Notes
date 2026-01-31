// AI Client Service (Talks to Firebase Cloud Functions)

window.aiClient = {
    isServerAvailable: async () => {
        // Since we are using Cloud Functions, they are always "available" if the internet is up
        return true;
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
