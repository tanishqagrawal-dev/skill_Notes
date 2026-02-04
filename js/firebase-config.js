// Firebase Configuration & Initialization
// Using CDN imports for browser compatibility without bundler
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, onSnapshot, updateDoc, doc, increment, serverTimestamp, query, where, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCayuSJlVlkRrtNtuglhK0M7aKNxEAp8g0",
    authDomain: "skill-notes.firebaseapp.com",
    projectId: "skill-notes",
    storageBucket: "skill-notes.firebasestorage.app",
    messagingSenderId: "679937247629",
    appId: "1:679937247629:web:708ae9818911a465d455c4",
    measurementId: "G-KSCJTPP875"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

console.log("🔥 Firebase initialized.");

// Export services
export { app, auth, db, storage, provider };

// Expose services to window for non-module scripts (like notes-hub.js)
window.firebaseServices = {
    app,
    auth,
    db,
    storage,
    provider,
    // Firestore helpers
    collection, addDoc, getDocs, getDoc, setDoc, onSnapshot, updateDoc, doc, increment, serverTimestamp, query, where, orderBy, deleteDoc,
    // Storage helpers
    ref, uploadBytesResumable, getDownloadURL, deleteObject
};
