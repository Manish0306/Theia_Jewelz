// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBEbRfCjqEOfoLTdrCPCuGHVRIOBPIUEIg",
    authDomain: "theiajewelz.firebaseapp.com",
    projectId: "theiajewelz",
    storageBucket: "theiajewelz.firebasestorage.app",
    messagingSenderId: "328369793227",
    appId: "1:328369793227:web:03c7cbf22b3c2f05cdd34e",
    measurementId: "G-1BKG612HJG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Export the app instance
export default app;

console.log('Firebase initialized successfully');