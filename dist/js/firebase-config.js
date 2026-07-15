// Firebase Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

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
    browserLocalPersistence,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    EmailAuthProvider,
    linkWithCredential,
    GithubAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    initializeFirestore,
    collection,
    addDoc,
    getDocs,
    getDocsFromServer,
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
    enableIndexedDbPersistence,
    enableNetwork,
    disableNetwork,
    terminate,
    clearIndexedDbPersistence,
    limit,
    getCountFromServer,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "INJECT_FIREBASE_API_KEY",
    authDomain: "INJECT_FIREBASE_AUTH_DOMAIN",
    projectId: "INJECT_FIREBASE_PROJECT_ID",
    storageBucket: "INJECT_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "INJECT_FIREBASE_MESSAGING_SENDER_ID",
    appId: "INJECT_FIREBASE_APP_ID",
    measurementId: "INJECT_FIREBASE_MEASUREMENT_ID"
};

// Initialize Firebase (Core only)
const app = initializeApp(firebaseConfig);

// Initialize Auth (Required for Auth Listeners)
// We keep this eager to ensure onAuthStateChanged works, but since this script is defer/module, it runs after parsing.
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// EAGER INIT (Standard for shared usage)
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
try {
    enableIndexedDbPersistence(db).catch(err => {
        console.warn("IndexedDB persistence failed (usually multiple tabs open):", err.code);
    });
} catch (e) {}

const storage = getStorage(app);
const functions = getFunctions(app);

// Expose services to window (for legacy compatibility)
window.firebaseServices = {
    // Core
    app,
    auth,
    provider,
    githubProvider,
    db, // Shared Instance
    storage,
    functions,

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
    sendPasswordResetEmail,

    // Firestore Functions
    collection,
    addDoc,
    getDocs,
    getDocsFromServer,
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
    enableNetwork,
    disableNetwork,
    terminate,
    clearIndexedDbPersistence,
    limit,
    getCountFromServer,
    runTransaction, // Exported correctly

    // Storage Functions
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,

    // Function Utils
    httpsCallable
};

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
    auth,
    db,
    storage,
    functions,
    provider,
    githubProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    EmailAuthProvider,
    linkWithCredential,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    limit,
    terminate,
    clearIndexedDbPersistence,
    getDocsFromServer,
    increment
};

// Global exports for inline interactions
window.auth = auth;
window.db = db;
window.doc = doc;
window.getDoc = getDoc;
window.setDoc = setDoc;
window.increment = increment;
