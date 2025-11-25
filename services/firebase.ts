import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, getDoc, arrayUnion } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDMuTq5H4T6zDT5C1vGZPQpHWYckJDyQqk",
  authDomain: "custom-uno.firebaseapp.com",
  databaseURL: "https://custom-uno-default-rtdb.firebaseio.com",
  projectId: "custom-uno",
  storageBucket: "custom-uno.firebasestorage.app",
  messagingSenderId: "585758258884",
  appId: "1:585758258884:web:fb65245a03a4446b737b91"
};

let db: any = null;
let auth: any = null;
let isConfigured = false;

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isConfigured = true;
} catch (e) {
    console.warn("Firebase initialization failed:", e);
}

export { db, auth, doc, setDoc, updateDoc, onSnapshot, getDoc, arrayUnion, signInAnonymously, isConfigured };