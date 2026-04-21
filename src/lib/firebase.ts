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
const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== 'undefined' && firebaseConfig.firestoreDatabaseId !== '') 
  ? firebaseConfig.firestoreDatabaseId 
  : '(default)';

console.log("Initializing Firestore with Database ID:", dbId);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Force long polling for maximum compatibility in iframes
  ignoreUndefinedProperties: true,
  // @ts-ignore - Some older versions or sub-packages of Firestore SDK still respect this in certain environments
  useFetchStreams: false, 
}, dbId);

// Test connection with retries and exponential backoff
const testConnection = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) console.log(`Firestore connection attempt ${i + 1}...`);
      
      // Use getDocFromServer to bypass local cache and truly test server connectivity
      // This path 'test/connection' is explicitly allowed in firestore.rules
      const testDoc = doc(db, 'test', 'connection');
      await getDocFromServer(testDoc).catch((err) => {
        // If it's just 'not-found', the server was reached!
        if (err.code === 'not-found') return;
        throw err;
      });
      
      console.log("Firestore connection verified successfully.");
      return;
    } catch (error: any) {
      const waitTime = Math.pow(2, i) * 1000;
      if (i === retries - 1) {
        console.error("Firestore connectivity issue:", error.message);
        console.info("The application will continue in offline mode. Changes will sync when a connection is restored.");
      } else {
        console.warn(`Firestore Connection Attempt ${i + 1} failed, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
};
testConnection();
