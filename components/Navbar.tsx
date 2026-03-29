'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#171a1f]/80 glass-nav flex justify-between items-center px-6 h-16">
      <div className="text-xl font-bold tracking-tighter text-[#e3e5f0] font-headline">
        <Link href="/">FlashMind</Link>
      </div>
      
      {user && (
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-[#b8c4ff] font-headline font-semibold tracking-tight">Home</Link>
          <Link href="/" className="text-[#e3e5f0]/60 hover:text-[#b8c4ff] transition-colors duration-200 font-semibold">Library</Link>
          <Link href="/ai-creator" className="text-[#e3e5f0]/60 hover:text-[#b8c4ff] transition-colors duration-200 font-semibold">AI Creator</Link>
        </nav>
      )}

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button className="text-[#e3e5f0]/60 hover:text-[#e3e5f0] font-semibold text-sm" onClick={handleLogout}>
              Logout
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
          </>
        ) : (
          <div className="flex gap-4">
            <Link href="/login" className="text-[#e3e5f0]/80 hover:text-white font-semibold">Login</Link>
            <Link href="/register" className="text-primary font-semibold">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
