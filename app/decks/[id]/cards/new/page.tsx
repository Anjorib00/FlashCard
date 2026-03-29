'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NewCard() {
  const { id } = useParams();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
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
      const deckId = Array.isArray(id) ? id[0] : id;
      
      await addDoc(collection(db, 'cards'), {
        deckId,
        front,
        back,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextReviewDate: new Date(),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
      });

      // Update card count in deck
      const deckRef = doc(db, 'decks', deckId);
      await updateDoc(deckRef, {
        cardCount: increment(1)
      });

      router.push(`/decks/${deckId}`);
    } catch (error) {
      console.error('Failed to create card', error);
    }
  };

  if (!isAuthReady) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold font-headline text-on-surface mb-8">Add New Card</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface-container p-8 rounded-xl border border-outline-variant/10">
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">Front</label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full bg-surface-container-low border-none border-b border-outline-variant/30 focus:border-primary focus:ring-0 rounded-xl px-4 py-3 text-on-surface min-h-[100px]"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">Back</label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full bg-surface-container-low border-none border-b border-outline-variant/30 focus:border-primary focus:ring-0 rounded-xl px-4 py-3 text-on-surface min-h-[100px]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-surface-container-low border-none border-b border-outline-variant/30 focus:border-primary focus:ring-0 rounded-xl px-4 py-3 text-on-surface"
              placeholder="e.g. key-term, definition"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm tracking-tight active:scale-95 transition-transform">
              Add Card
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
