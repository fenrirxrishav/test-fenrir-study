
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, type DocumentReference } from 'firebase/firestore';
import { useFirebase } from '../provider';
import { type User as AppUser } from '@/lib/definitions';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

export function useUser() {
  const { auth, firestore, loading: firebaseLoading } = useFirebase();
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
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
        
        try {
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const newUser: Omit<AppUser, 'id'| 'avatarUrl'> = {
              name: authUser.displayName || 'Anonymous',
              email: authJUser.email || '',
            }
            const userData = {
                ...newUser,
                uid: authUser.uid,
                photoURL: authUser.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
            };
            
            // Create user profile with contextual error handling
            setDoc(userRef, userData).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'create',
                    requestResourceData: userData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });

          } else {
            // Update last login with contextual error handling
            const updateData = { lastLogin: serverTimestamp() };
            setDoc(userRef, updateData, { merge: true }).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
          }
        } catch (e) {
            // This will catch errors from getDoc, which might also be a permission error
            console.error("An unexpected error occurred in useUser:", e);
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
