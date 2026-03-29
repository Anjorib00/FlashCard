'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Deck {
  id: string;
  title: string;
  description: string | null;
  _count: { cards: number };
}

export default function Dashboard() {
  const { user, isAuthReady } = useAuthStore();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const fetchDecks = async () => {
      try {
        const q = query(
          collection(db, 'decks'),
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedDecks: Deck[] = [];
        
        for (const doc of querySnapshot.docs) {
          const deckData = doc.data();
          fetchedDecks.push({
            id: doc.id,
            title: deckData.title,
            description: deckData.description,
            _count: { cards: deckData.cardCount || 0 }
          });
        }
        
        setDecks(fetchedDecks);
      } catch (error) {
        console.error('Failed to fetch decks', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [user, isAuthReady, router]);

  if (!isAuthReady || loading) {
    return <div className="min-h-screen flex items-center justify-center text-on-surface">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container p-8 rounded-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-primary font-bold text-xl">🔥</span>
                <span className="text-xs font-bold tracking-[0.1em] uppercase text-on-surface-variant font-label">Daily Momentum</span>
              </div>
              <h2 className="text-5xl font-bold font-headline tracking-tighter text-on-surface">15 Day Streak</h2>
              <p className="mt-2 text-on-surface-variant text-sm">You&apos;re in the top 5% of learners this week.</p>
            </div>

            <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold tracking-[0.1em] uppercase text-on-surface-variant font-label">Lifetime Mastery</span>
                  <div className="text-4xl font-bold font-headline mt-1">1,284</div>
                  <div className="text-sm text-on-surface-variant">Cards studied</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold tracking-[0.1em] uppercase text-primary font-label">Accuracy</span>
                  <div className="text-4xl font-bold font-headline mt-1 text-primary">92%</div>
                </div>
              </div>
              <div className="mt-6 h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[92%]"></div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-8">
              <h3 className="text-2xl font-bold font-headline tracking-tight text-on-surface">Your Decks</h3>
              <button className="text-primary text-sm font-semibold hover:underline">View All Library</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {decks.map((deck) => (
                <div key={deck.id} className="bg-surface-container p-6 rounded-xl hover:bg-surface-container-high transition-all duration-300 flex flex-col justify-between h-56 border border-white/[0.03]">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="bg-primary-container/20 p-2 rounded-lg text-primary font-bold">📚</div>
                      <span className="text-[10px] bg-surface-container-highest px-2 py-1 rounded font-bold uppercase tracking-wider text-on-surface-variant">Deck</span>
                    </div>
                    <h4 className="text-xl font-bold mt-4 font-headline text-on-surface">{deck.title}</h4>
                    <p className="text-sm text-on-surface-variant">{deck._count.cards} Cards</p>
                  </div>
                  <Link href={`/decks/${deck.id}`} className="w-full bg-surface-container-highest text-on-surface py-3 rounded-xl font-bold text-sm tracking-tight active:scale-95 transition-transform hover:bg-surface-bright text-center block">
                    View Deck
                  </Link>
                </div>
              ))}

              <Link href="/decks/new" className="border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center gap-3 group hover:border-primary/50 transition-all h-56">
                <span className="text-on-surface-variant group-hover:text-primary text-3xl">+</span>
                <span className="text-sm font-semibold text-on-surface-variant group-hover:text-primary">Create New Deck</span>
              </Link>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-low p-8 rounded-xl border border-white/[0.02]">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-on-surface-variant mb-6 font-label">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/decks/new" className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container hover:bg-surface-container-highest transition-all group">
                <span className="text-primary font-bold text-xl">+</span>
                <span className="font-semibold text-sm text-on-surface">Create New Deck</span>
              </Link>
              <Link href="/ai-creator" className="w-full flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group">
                <span className="text-primary font-bold text-xl">✨</span>
                <div className="text-left">
                  <span className="block font-bold text-sm text-primary">Generate with AI</span>
                  <span className="text-[10px] text-primary-dim uppercase tracking-wider font-bold">Powered by FlashMind AI</span>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#171a1f] to-[#0d0e11] p-8 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-lg font-bold font-headline mb-2 leading-tight text-on-surface">Ready for deep focus?</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-6">Enter a distraction-free environment designed for peak retention and cognitive flow.</p>
              <button className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 group">
                Enter Focus Sanctuary →
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          </div>
        </aside>
      </main>
    </div>
  );
}
