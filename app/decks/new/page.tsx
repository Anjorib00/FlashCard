'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NewDeck() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const { user, isAuthReady } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !user) {
      router.push('/login');
    }
  }, [isAuthReady, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, 'decks'), {
        title,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        userId: user.id,
        isPublic: false,
        cardCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      router.push(`/decks/${docRef.id}`);
    } catch (error) {
      console.error('Failed to create deck', error);
    }
  };

  if (!isAuthReady) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold font-headline text-on-surface mb-8">Create New Deck</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface-container p-8 rounded-xl border border-outline-variant/10">
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container-low border-none border-b border-outline-variant/30 focus:border-primary focus:ring-0 rounded-xl px-4 py-3 text-on-surface"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-container-low border-none border-b border-outline-variant/30 focus:border-primary focus:ring-0 rounded-xl px-4 py-3 text-on-surface min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-surface-container-low border-none border-b border-outline-variant/30 focus:border-primary focus:ring-0 rounded-xl px-4 py-3 text-on-surface"
              placeholder="e.g. science, biology"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm tracking-tight active:scale-95 transition-transform">
              Create Deck
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
