"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
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
  const value = useMemo(() => {
    // This check ensures Firebase is only initialized on the client side.
    if (typeof window !== 'undefined') {
      return { app, auth, firestore };
    }
    return { app: null, auth: null, firestore: null };
  }, []);

  return (
    <FirebaseContext.Provider value={value}>
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
