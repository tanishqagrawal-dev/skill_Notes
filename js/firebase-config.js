// Firebase Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, updateDoc, doc, increment, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCayuSJlVlkRrtNtuglhK0M7aKNxEAp8g0",
    authDomain: "skill-notes.firebaseapp.com",
    projectId: "skill-notes",
    storageBucket: "skill-notes.firebasestorage.app",
    messagingSenderId: "679937247629",
    appId: "1:679937247629:web:708ae9818911a465d455c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

console.log("🔥 Firebase initialized successfully!");

// Expose services to window for use in non-module scripts (like dashboard.js)
window.firebaseServices = {
    auth,
    db,
    provider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    updateDoc,
    doc,
    increment,
    query,
    where,
    orderBy
};

export { app, analytics, auth, db, provider };
