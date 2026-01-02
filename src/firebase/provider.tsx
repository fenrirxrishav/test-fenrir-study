"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { app, auth, firestore } from './config';

interface FirebaseContextType {
  app: FirebaseApp | undefined;
  auth: Auth | undefined;
  firestore: Firestore | undefined;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: undefined, auth: undefined, firestore: undefined });

export function FirebaseProvider({ children }: { children: ReactNode }) {
    // Directly use the imported services. The config file already handles client-side-only initialization.
    const firebaseServices = { app, auth, firestore };

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
