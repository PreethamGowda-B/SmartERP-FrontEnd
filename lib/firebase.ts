import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// ✅ All Firebase config values must be set as environment variables.
// Never hardcode these in source — they appear in version control and bundles.
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate at startup — fail loudly in development, warn in production
if (typeof window !== "undefined") {
  const missing = Object.entries(requiredEnvVars)
    .filter(([, v]) => !v)
    .map(([k]) => `NEXT_PUBLIC_${k.replace(/([A-Z])/g, "_$1").toUpperCase()}`);

  if (missing.length > 0) {
    const msg = `Firebase config missing env vars: ${missing.join(", ")}`;
    if (process.env.NODE_ENV === "development") {
      throw new Error(msg);
    } else {
      console.error("⚠️ " + msg);
    }
  }
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: requiredEnvVars.authDomain,
  projectId: requiredEnvVars.projectId,
  storageBucket: requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId: requiredEnvVars.appId,
  measurementId: requiredEnvVars.measurementId,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let messaging: any = null;

if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

export { app, messaging };

// VAPID key from environment — never hardcoded
export const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || "";
