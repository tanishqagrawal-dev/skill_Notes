# FIX: Support Inbox Access

The Support Inbox was failing because **Firestore Security Rules** were blocking access.

## I Have Updated The Rules
I updated `firestore.rules` to include:
```javascript
match /support_queries/{queryId} {
  allow create: if true;
  allow read, update, delete: if isAdmin();
}
```

## ACTION REQUIRED: Deploy Rules
1.  Go to [Firebase Console](https://console.firebase.google.com/)
2.  Navigate to **Firestore Database** > **Rules**.
3.  Copy the content of the local `firestore.rules` file.
4.  Paste it into the Firebase Console editor.
5.  Click **Publish**.

Once published, the Support Inbox will start loading tickets immediately.
