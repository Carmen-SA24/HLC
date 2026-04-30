import { initializeApp } from "firebase/app";
import { initializeAuth, browserSessionPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

// Inicia la app de Firebase
const app = initializeApp(firebaseConfig);

// Autenticación con persistencia solo en sesión del navegador
// (al cerrar el navegador o la pestaña, se cierra la sesión automáticamente)
export const auth = initializeAuth(app, {
  persistence: typeof window !== 'undefined' ? browserSessionPersistence : inMemoryPersistence,
});

// Obtiene Firestore - para guardar datos
export const db = getFirestore(app);

// Obtiene Storage - para guardar archivos
export const storage = getStorage(app);

export default app;
