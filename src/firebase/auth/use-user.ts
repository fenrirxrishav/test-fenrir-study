
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useFirebase } from '../provider';
import type { User as AppUser } from '@/lib/definitions';

export function useUser() {
  const { auth, firestore, loading: firebaseLoading } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseLoading) {
      setLoading(true);
      return;
    }
    
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userRef = doc(firestore, `users/${authUser.uid}`);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // New user, create their profile document
          try {
            const newUser: Omit<AppUser, 'id'> = {
              name: authUser.displayName || 'Anonymous',
              email: authUser.email || '',
              avatarUrl: authUser.photoURL || '',
            }
            await setDoc(userRef, {
              ...newUser,
              uid: authUser.uid,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
          } catch(e) {
            console.error("Error creating user profile:", e);
          }
        } else {
          // Existing user, update last login
          try {
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          } catch (e) {
            console.error("Error updating last login:", e);
          }
        }
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, firebaseLoading]);

  return { user, loading };
}
