# How to Enable Real Emails

To send inquiries to receiving `skilmatrix3@gmail.com` and auto-replies to users, you need to use **EmailJS** (Free Service).

## Step 1: Create Account
1.  Go to [emailjs.com](https://www.emailjs.com/) and Sign Up for free.

## Step 2: Add Email Service
1.  Click **Add New Service** > **Gmail**.
2.  Connect your `skilmatrix3@gmail.com` account.
3.  Copy the **Service ID** (e.g., `service_xyz123`).

## Step 3: Create Email Template
1.  Click **Email Templates** > **Create New Template**.
2.  **Subject**: `Inquiry from {{from_name}}: {{subject}}`
3.  **Content**: 
    ```
    New Message Received:
    Name: {{from_name}}
    Email: {{from_email}}
    Message: 
    {{message}}
    ```
4.  **Auto-Reply (Important!)**:
    - Check the "Auto-Reply" box in settings OR create a designated "Auto-Reply" template.
    - If manual: Create a second template that says "Thanks for contacting us... we will reply in 48-72 hours".
5.  Copy the **Template ID** (e.g., `template_abc456`).

## Step 4: Get Public Key
1.  Go to **Account** > **General**.
2.  Copy your **Public Key**.

## Step 5: Update Code
Open `pages/contact.html` and replace the placeholders:

```javascript
emailjs.init({
    publicKey: "PASTE_PUBLIC_KEY_HERE",
});

// ... inside handleContactSubmit ...
emailjs.send('PASTE_SERVICE_ID_HERE', 'PASTE_TEMPLATE_ID_HERE', templateParams)
```

Once done, the website will actually send emails!
