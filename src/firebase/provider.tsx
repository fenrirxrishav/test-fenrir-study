
"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { initializeFirebase } from './config';

interface FirebaseContextType {
  app: FirebaseApp | undefined;
  auth: Auth | undefined;
  firestore: Firestore | undefined;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: undefined, auth: undefined, firestore: undefined });

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const [firebaseServices, setFirebaseServices] = useState<FirebaseContextType>({ app: undefined, auth: undefined, firestore: undefined });

    useEffect(() => {
        // Initialize Firebase on the client and update the state
        const services = initializeFirebase();
        setFirebaseServices({
            app: services.app,
            auth: services.auth,
            firestore: services.firestore,
        });
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

export const useFirebaseApp = (): FirebaseApp | undefined => {
  const { app } = useFirebase();
  return app;
}

export const useAuth = (): Auth | undefined => {
  const { auth } = useFirebase();
  return auth;
}

export const useFirestore = (): Firestore | undefined => {
  const { firestore } = useFirebase();
  return firestore;
}
