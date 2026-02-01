# Support System Enabled

I have built the Professional Support System.

## Features
1.  **User Form with Auto-Reply**: `pages/contact.html`
2.  **Admin Inbox**: `admin-dashboard.html` > Command Center > "Support Inbox"

## How to make it LIVE (Important)
You must configure your email provider.

1.  Open `js/email-config.js`
2.  Replace the placeholders with your **EmailJS keys**:
    - `PUBLIC_KEY`
    - `SERVICE_ID`
    - `TEMPLATE_AUTO_REPLY` (Create this on emailjs.com)
    - `TEMPLATE_ADMIN_REPLY` (Create this on emailjs.com)

## Testing
1.  **User**: Go to Contact Us, fill form.
2.  **Verify**: Check "success modal" appears.
3.  **Admin**: Go to Admin Dashboard, click "Support Inbox", you should see the ticket.
4.  **Reply**: Click the ticket, type a reply, and send.
