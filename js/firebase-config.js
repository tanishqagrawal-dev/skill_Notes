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
    enableIndexedDbPersistence,
    getCountFromServer,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

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

// Initialize Firebase (Core only)
const app = initializeApp(firebaseConfig);

// Initialize Auth (Required for Auth Listeners)
// We keep this eager to ensure onAuthStateChanged works, but since this script is defer/module, it runs after parsing.
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// EAGER INIT (Standard for shared usage)
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Enable Persistence (Optional but good)
enableIndexedDbPersistence(db).catch(err => {
    if (err.code == 'failed-precondition') {
        console.warn("⚠️ Persistence failed: Multiple tabs open");
    } else if (err.code == 'unimplemented') {
        console.warn("⚠️ Persistence not supported in this browser");
    }
});

// Expose services to window (for legacy compatibility)
window.firebaseServices = {
    // Core
    app,
    auth,
    provider,
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
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    onSnapshot
};
