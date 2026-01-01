import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQvLgnyJODW_rC9XbMyh8OdD4dNXQ7t_A",
  authDomain: "fenrirstudyx.firebaseapp.com",
  projectId: "fenrirstudyx",
  storageBucket: "fenrirstudyx.appspot.com",
  messagingSenderId: "475370976510",
  appId: "1:475370976510:web:247ee49c0da89bb6d461af",
  measurementId: "G-BJ6LFCWL1T"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
