---
description: How to deploy the application to Firebase Hosting and Functions
---
# Firebase Deployment Guide

Since GitHub Pages cannot execute Firebase Functions or server-side logic, we are transitioning to Firebase Hosting. Follow these steps to deploy your application.

## Prerequisites
Ensure you have Node.js and npm installed on your system.

## Steps

### 1. Install Firebase Tools
Open your terminal and run:
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
This will open your browser for authentication:
```bash
firebase login
```

### 3. Initialize Firebase
If you haven't already linked your project, run:
```bash
firebase init
```
**Options to select:**
- Features: `Hosting`, `Functions`
- Project: `skill-notes` (Select from existing)
- Hosting Public Directory: `.`
- Configure as single-page app: `Yes`
- Overwrite existing files: `No` (Important!)

### 4. Deploy the Application
Run the following command to deploy everything:
// turbo
```bash
firebase deploy
```

## Post-Deployment
Once deployed, Firebase will provide you with a Hosting URL (e.g., `https://skill-notes.web.app`). Use this URL instead of GitHub Pages to access your fully functional application.
