'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/useStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        user.getIdToken().then((token) => {
          login({ id: user.uid, email: user.email || '', name: user.displayName || '' }, token);
          setLoading(false);
        });
      } else {
        logout();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [login, logout]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">Loading...</div>;
  }

  return <>{children}</>;
}
