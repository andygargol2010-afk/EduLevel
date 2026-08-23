import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => value && value !== "REPLACE_WITH_YOUR_VALUE");

export const firebaseApp = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider = auth ? new GoogleAuthProvider() : null;

if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
}

export const mapUser = (user: User | null): AuthUser | null => {
  if (!user) return null;

  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
};

export const subscribeToAuth = (callback: (user: AuthUser | null) => void) => {
  if (!auth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, (user) => callback(mapUser(user)));
};

export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error("Google Sign-In no está configurado todavía. Agrega las variables VITE_FIREBASE_* en tu .env");
  }

  return signInWithPopup(auth, googleProvider);
};

export const signOutFromGoogle = async () => {
  if (!auth) {
    throw new Error("Google Sign-In no está configurado todavía.");
  }

  await signOut(auth);
};
