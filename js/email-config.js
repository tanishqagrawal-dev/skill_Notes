// EmailJS Configuration
// Get these from https://dashboard.emailjs.com/admin
const EmailConfig = {
    PUBLIC_KEY: "YOUR_PUBLIC_KEY_HERE",
    SERVICE_ID: "YOUR_SERVICE_ID_HERE",
    TEMPLATE_AUTO_REPLY: "YOUR_TEMPLATE_ID_AUTO_REPLY", // Template for "We received your message"
    TEMPLATE_ADMIN_REPLY: "YOUR_TEMPLATE_ID_ADMIN_REPLY" // Template for converting Admin reply to email
};

window.EmailConfig = EmailConfig;
