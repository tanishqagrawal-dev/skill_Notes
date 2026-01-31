// AI Client Service (Talks to Local Node.js Backend)

const API_URL = 'http://localhost:3000/api';

window.aiClient = {
    isServerAvailable: async () => {
        try {
            const res = await fetch('http://localhost:3000/');
            return res.status === 200;
        } catch (e) {
            return false;
        }
    },

    generateModelPaper: async (data) => {
        try {
            const response = await fetch(`${API_URL}/generate-paper`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || "Failed to generate paper");
            }

            return result;
        } catch (error) {
            console.error("AI Client Error:", error);
            // Friendly error message mapping
            if (error.message.includes('Failed to fetch')) {
                throw new Error("Local AI Server is not running. Please run 'node server.js' in the server folder.");
            }
            throw error;
        }
    }
};
