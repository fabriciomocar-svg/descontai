
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Configuração do Firebase fornecida
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBedPAIFi22eD3TcRGaLQtBdZ2EBNHW4BM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "descontai-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "descontai-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "descontai-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "769936795657",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:769936795657:web:c5297d6efa8a308b5670d8"
};

export const isFirebaseConfigured = 
  firebaseConfig.apiKey !== "SUA_API_KEY" && 
  firebaseConfig.projectId !== "SEU_PROJETO" &&
  firebaseConfig.apiKey !== "" &&
  firebaseConfig.projectId !== "";

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = isFirebaseConfigured ? getFirestore(app) : null;
export const auth = isFirebaseConfigured ? getAuth(app) : null;
export const storage = isFirebaseConfigured ? getStorage(app) : null;
