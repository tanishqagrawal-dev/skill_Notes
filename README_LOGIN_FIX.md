# Google Login Fix

I have resolved the issue with Google Login.

## The Fix
1.  **Missing Exports**: `firebase-config.js` was missing `setDoc` and `serverTimestamp` exports. This caused a crash when `auth.js` tried to save user data.
2.  **Redirect Paths**: `auth.js` was using incorrect relative paths (e.g., `pages/pages/dashboard.html`) when redirecting from the `pages/` directory.

## Verification
1.  Reload `auth.html` or `login.html`.
2.  Click **Google Login**.
3.  You should be redirected to the correct Dashboard based on your role.
