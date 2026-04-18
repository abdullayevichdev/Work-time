import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
// @ts-ignore
import localConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with forced long-polling to bypass corporate firewalls or iframe blocks
const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  host: 'firestore.googleapis.com',
  ssl: true,
}, dbId);

// Firebase ready
// Test connection
const testConnection = async () => {
  try {
    // Attempt to fetch a document to verify connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    console.warn("Firestore Connection Test:", error.message);
    if (error?.message?.includes('the client is offline') || error?.message?.includes('Could not reach')) {
      console.error("Please check your Firebase configuration or internet connection. Forced long polling is enabled.");
    }
  }
};
testConnection();
