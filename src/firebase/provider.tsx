"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { app, auth, firestore } from './config';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, auth: null, firestore: null });

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const [firebaseServices, setFirebaseServices] = useState<FirebaseContextType>({ app: null, auth: null, firestore: null });

    useEffect(() => {
        // This effect runs only on the client, ensuring app, auth, and firestore are available.
        if (app && auth && firestore) {
            setFirebaseServices({ app, auth, firestore });
        }
    }, []);

    return (
        <FirebaseContext.Provider value={firebaseServices}>
        {children}
        </FirebaseContext.Provider>
    );
}

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp | null => {
  const { app } = useFirebase();
  return app;
}

export const useAuth = (): Auth | null => {
  const { auth } = useFirebase();
  return auth;
}

export const useFirestore = (): Firestore | null => {
  const { firestore } = useFirebase();
  return firestore;
}
