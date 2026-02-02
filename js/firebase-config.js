// Firebase Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
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
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

// Initialize Firebase (Core only)
const app = initializeApp(firebaseConfig);

// Initialize Auth (Required for Auth Listeners)
// We keep this eager to ensure onAuthStateChanged works, but since this script is defer/module, it runs after parsing.
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// LAZY LOAD HEAVY SERVICES
let db = null;
let analytics = null;
let storage = null;
let functions = null;

console.log("🔥 Firebase Core initialized. Heavy services paused.");

const firebaseFunctions = null; // Placeholder handling

// Expose services to window with LAZY GETTERS
window.firebaseServices = {
    // Core
    app,
    auth,
    provider,

    // Auth Functions
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,

    // Firestore Functions
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

    // Storage Functions
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,

    // Function Utils
    httpsCallable,
    logEvent
};

// Define Lazy Getters for Heavy Services
Object.defineProperty(window.firebaseServices, 'db', {
    get: function () {
        if (!db) {
            console.log("🚀 Lazy-loading Firestore...");
            db = getFirestore(app);
            enableIndexedDbPersistence(db).then(() => {
                console.log("💾 Offline Persistence Enabled");
            }).catch(err => {
                if (err.code == 'failed-precondition') {
                    console.warn("⚠️ Persistence failed: Multiple tabs open");
                } else if (err.code == 'unimplemented') {
                    console.warn("⚠️ Persistence not supported in this browser");
                }
            });
        }
        return db;
    }
});

Object.defineProperty(window.firebaseServices, 'analytics', {
    get: function () {
        if (!analytics) {
            // Delay analytics slightly more if possible, but here we init on access
            console.log("📊 Lazy-loading Analytics...");
            analytics = getAnalytics(app);
        }
        return analytics;
    }
});

Object.defineProperty(window.firebaseServices, 'storage', {
    get: function () {
        if (!storage) {
            console.log("📦 Lazy-loading Storage...");
            storage = getStorage(app);
        }
        return storage;
    }
});

Object.defineProperty(window.firebaseServices, 'functions', {
    get: function () {
        if (!functions) {
            console.log("⚡ Lazy-loading Functions...");
            try {
                functions = getFunctions(app);
            } catch (e) { console.warn("Functions init error", e); }
        }
        return functions;
    }
});


export {
    app,
    analytics,
    auth,
    db,
    storage,
    functions,
    provider,
    logEvent,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence
};
