import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDD97nk7cZ8zcBcF_LWcLp7rtXIyQ7el78",
  authDomain: "gpu-7ee7b.firebaseapp.com",
  projectId: "gpu-7ee7b",
  storageBucket: "gpu-7ee7b.firebasestorage.app",
  messagingSenderId: "133340030065",
  appId: "1:133340030065:web:578a0af04c3bfb22c4a7d0",
  measurementId: "G-HWLCC2V7GX"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

