const fetch = require("node-fetch");
const url = "https://script.google.com/macros/s/AKfycbwq1zaoR-Jtv8bb3gWaQ2IBMf5UlGK22-1wHQpp4VZ7XzqCCNDhOL1JMS_SCiziKlZn5w/exec";
(async () => {
    try {
        const payload = {
            base64: "SGVsbG8gV29ybGQ=", // Base64 for "Hello World"
            mimeType: "text/plain",
            fileName: "test.txt"
        };
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (err) {
        console.error("Error:", err);
    }
})();
