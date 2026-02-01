// Firebase Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, onSnapshot, updateDoc, doc, increment, serverTimestamp, query, where, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCayuSJlVlkRrtNtuglhK0M7aKNxEAp8g0",
    authDomain: "skill-notes.firebaseapp.com",
    projectId: "skill-notes",
    storageBucket: "skil-notes",
    messagingSenderId: "679937247629",
    appId: "1:679937247629:web:708ae9818911a465d455c4",
    measurementId: "G-Q334FN7M78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const provider = new GoogleAuthProvider();

console.log("🔥 Firebase initialized successfully!");

const firebaseFunctions = functions; // Alias to avoid conflict if any

// Expose services to window for use in non-module scripts (like dashboard.js)
window.firebaseServices = {
    auth,
    db,
    storage,
    functions: firebaseFunctions,
    provider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    onSnapshot,
    updateDoc,
    doc,
    increment,
    serverTimestamp,
    query,
    where,
    orderBy,
    deleteDoc,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    getFunctions,
    httpsCallable,
    logEvent
};

export { app, analytics, auth, db, storage, functions, provider, logEvent };
