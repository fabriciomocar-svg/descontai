
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Configuração do Firebase fornecida
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBedPAIFi22eD3TcRGaLQtBdZ2EBNHW4BM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "descontai-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "descontai-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "descontai-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "769936795657",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:769936795657:web:c5297d6efa8a308b5670d8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
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
export const messaging = isFirebaseConfigured ? getMessaging(app) : null;
export const analytics = isFirebaseConfigured ? getAnalytics(app) : null;

// Inicializar App Check se a chave estiver configurada
if (isFirebaseConfigured && app && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('🛡️ Firebase App Check inicializado com sucesso');
  } catch (e) {
    console.warn('⚠️ Falha ao inicializar App Check:', e);
  }
}
