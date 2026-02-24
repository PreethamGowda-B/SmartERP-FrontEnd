import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA5lsAUHUq55sp8BX6T2znI7q1E6aUUdi4",
  authDomain: "smarterp-f9c77.firebaseapp.com",
  projectId: "smarterp-f9c77",
  storageBucket: "smarterp-f9c77.firebasestorage.app",
  messagingSenderId: "135746614028",
  appId: "1:135746614028:web:9f9dc23cdb1f627ef9cf29",
  measurementId: "G-3201YM5BE3"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let messaging: any = null;

if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

export { app, messaging };
export const VAPID_KEY = "BJZ9R7c_wB_xUe90Fgz4b5wZ4rIU8iH4RxgprOwDWwnUlEBtYQC11PInR_vO_upwxsJ7ahIoQuuuhmd31EV46z8";
