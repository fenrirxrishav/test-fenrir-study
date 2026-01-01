import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQvLgnyJODW_rC9XbMyh8OdD4dNXQ7t_A",
  authDomain: "fenrirstudyx.firebaseapp.com",
  projectId: "fenrirstudyx",
  storageBucket: "fenrirstudyx.appspot.com",
  messagingSenderId: "475370976510",
  appId: "1:475370976510:web:247ee49c0da89bb6d461af",
  measurementId: "G-BJ6LFCWL1T"
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This check ensures that Firebase is only initialized on the client side.
if (typeof window !== 'undefined') {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
  } catch(e) {
    console.error("Firebase initialization error", e);
  }
}

// The exports are now guarded and will be undefined on the server.
export { app, auth, firestore };
