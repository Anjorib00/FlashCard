'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useStore';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Card {
  id: string;
  front: string;
  back: string;
  tags: string[];
}

interface Deck {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  cards: Card[];
}

export default function DeckView() {
  const { id } = useParams();
  const { user, isAuthReady } = useAuthStore();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchDeck = async () => {
      try {
        const deckId = Array.isArray(id) ? id[0] : id;
        if (!deckId) return;
        const deckRef = doc(db, 'decks', deckId);
        const deckSnap = await getDoc(deckRef);

        if (deckSnap.exists()) {
          const deckData = deckSnap.data();
          
          // Check access
          if (deckData.userId !== user.id && !deckData.isPublic) {
            router.push('/');
            return;
          }

          // Fetch cards
          const cardsQuery = query(
            collection(db, 'cards'),
            where('deckId', '==', deckId),
            where('userId', '==', user.id),
            orderBy('createdAt', 'desc')
          );
          const cardsSnap = await getDocs(cardsQuery);
          const cards: Card[] = [];
          cardsSnap.forEach((doc) => {
            cards.push({ id: doc.id, ...doc.data() } as Card);
          });

          setDeck({
            id: deckSnap.id,
            title: deckData.title,
            description: deckData.description,
            tags: deckData.tags || [],
            cards,
          });
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to fetch deck', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [id, user, isAuthReady, router]);

  if (!isAuthReady || loading) return <div className="min-h-screen flex items-center justify-center text-on-surface">Loading...</div>;
  if (!deck) return <div className="min-h-screen flex items-center justify-center text-on-surface">Deck not found</div>;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/" className="text-on-surface-variant hover:text-primary text-sm font-semibold">← Back to Library</Link>
            </div>
            <h1 className="text-4xl font-bold font-headline text-on-surface">{deck.title}</h1>
            {deck.description && <p className="text-on-surface-variant mt-2">{deck.description}</p>}
            <div className="flex gap-2 mt-4">
              {deck.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-surface-container-highest px-2 py-1 rounded font-bold uppercase tracking-wider text-on-surface-variant">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <Link href={`/decks/${id}/cards/new`} className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm text-center bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors">
              Add Card
            </Link>
            <Link href={`/decks/${id}/study`} className="flex-1 md:flex-none px-8 py-3 rounded-xl font-bold text-sm text-center tracking-tight bg-primary text-on-primary active:scale-95 transition-transform">
              Study Now
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold font-headline text-on-surface border-b border-outline-variant/20 pb-4">
            Cards ({deck.cards.length})
          </h3>
          
          {deck.cards.length === 0 ? (
            <div className="text-center py-12 bg-surface-container rounded-xl border border-dashed border-outline-variant/30">
              <p className="text-on-surface-variant mb-4">This deck is empty.</p>
              <Link href={`/decks/${id}/cards/new`} className="text-primary font-semibold hover:underline">
                Add your first card
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {deck.cards.map((card) => (
                <div key={card.id} className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 flex flex-col md:flex-row gap-6 hover:border-outline-variant/30 transition-colors">
                  <div className="flex-1">
                    <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2 block">Front</span>
                    <p className="text-on-surface font-medium">{card.front}</p>
                  </div>
                  <div className="hidden md:block w-px bg-outline-variant/20"></div>
                  <div className="flex-1">
                    <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2 block">Back</span>
                    <p className="text-on-surface-variant">{card.back}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <button className="text-on-surface-variant hover:text-primary text-sm font-semibold px-3 py-1 rounded bg-surface-container-highest">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
