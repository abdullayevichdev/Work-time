import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import App from './App.tsx';
import './index.css';

// Test connection
const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
};
testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
