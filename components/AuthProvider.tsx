'use client';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useStore';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, setAuthReady } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Save user to Firestore if not exists
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date(),
          });
        }

        const token = await user.getIdToken();
        login({ id: user.uid, email: user.email!, name: user.displayName }, token);
      } else {
        logout();
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [login, logout, setAuthReady]);

  return <>{children}</>;
}
