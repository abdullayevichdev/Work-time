import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
// @ts-ignore
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// CRITICAL: Initialize Firestore with forced long-polling to bypass corporate firewalls or iframe blocks
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Forces HTTP instead of WebSockets
}, firebaseConfig.firestoreDatabaseId);

// Firebase ready
