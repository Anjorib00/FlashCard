'use client';

import { useEffect, useState, useCallback } from 'next';
import { useAuthStore } from '@/store/useStore';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Card {
  id: string;
  front: string;
  back: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: Timestamp;
}

export default function StudyMode() {
  const { id } = useParams();
  const { user, isAuthReady } = useAuthStore();
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchCards = async () => {
      try {
        const deckId = Array.isArray(id) ? id[0] : id;
        const now = new Date();
        
        const q = query(
          collection(db, 'cards'),
          where('deckId', '==', deckId),
          where('userId', '==', user.id),
          where('nextReviewDate', '<=', now)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedCards: Card[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCards.push({ id: doc.id, ...doc.data() } as Card);
        });
        
        setCards(fetchedCards);
      } catch (error) {
        console.error('Failed to fetch cards', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [id, user, isAuthReady, router]);

  const handleReview = useCallback(async (rating: number) => {
    if (cards.length === 0 || finished || !user) return;

    const currentCard = cards[currentIndex];

    // SM-2 Algorithm
    let { repetitions, easeFactor, interval } = currentCard;
    
    // Map rating 1-4 to SM-2 quality 0-5
    // 1 (Again) -> 0
    // 2 (Hard) -> 3
    // 3 (Good) -> 4
    // 4 (Easy) -> 5
    const qualityMap: Record<number, number> = { 1: 0, 2: 3, 3: 4, 4: 5 };
    const quality = qualityMap[rating];

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    try {
      const cardRef = doc(db, 'cards', currentCard.id);
      await updateDoc(cardRef, {
        repetitions,
        easeFactor,
        interval,
        nextReviewDate,
        updatedAt: new Date()
      });

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        setFinished(true);
      }
    } catch (error) {
      console.error('Failed to submit review', error);
    }
  }, [cards, currentIndex, finished, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finished) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        switch (e.key) {
          case '1': handleReview(1); break; // Again
          case '2': handleReview(2); break; // Hard
          case '3': handleReview(3); break; // Good
          case '4': handleReview(4); break; // Easy
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, finished, handleReview]);

  if (!isAuthReady || loading) return <div className="min-h-screen flex items-center justify-center text-on-surface">Loading...</div>;

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h2 className="text-2xl font-bold font-headline text-on-surface mb-4">No cards to study right now!</h2>
          <button onClick={() => router.push(`/decks/${id}`)} className="text-primary font-semibold hover:underline">
            Go back to deck
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-center bg-surface-container p-12 rounded-2xl border border-outline-variant/10">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold font-headline text-on-surface mb-4">Session Complete!</h2>
          <p className="text-on-surface-variant mb-8">You've reviewed all due cards in this deck.</p>
          <button onClick={() => router.push(`/decks/${id}`)} className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm tracking-tight active:scale-95 transition-transform">
            Return to Deck
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 max-w-4xl mx-auto w-full">
        <div className="w-full flex justify-between items-center mb-8 text-sm font-bold tracking-widest uppercase text-on-surface-variant">
          <span>Card {currentIndex + 1} / {cards.length}</span>
          <button onClick={() => router.push(`/decks/${id}`)} className="hover:text-primary transition-colors">Exit Study</button>
        </div>

        <div className="w-full aspect-[3/2] perspective-1000 relative cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          <motion.div
            className="w-full h-full relative preserve-3d transition-all duration-500"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden bg-surface-container rounded-3xl border border-outline-variant/10 p-10 flex flex-col items-center justify-center text-center shadow-2xl">
              <span className="absolute top-6 left-6 text-xs font-bold tracking-widest uppercase text-primary/50">Front</span>
              <h2 className="text-3xl md:text-5xl font-bold font-headline text-on-surface leading-tight">{currentCard.front}</h2>
              <div className="absolute bottom-6 text-xs font-bold tracking-widest uppercase text-on-surface-variant/50 animate-pulse">
                Press Space or Click to Flip
              </div>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full backface-hidden bg-surface-container-high rounded-3xl border border-primary/20 p-10 flex flex-col items-center justify-center text-center shadow-2xl rotate-y-180">
              <span className="absolute top-6 left-6 text-xs font-bold tracking-widest uppercase text-primary/50">Back</span>
              <p className="text-2xl md:text-3xl font-medium text-on-surface leading-relaxed">{currentCard.back}</p>
            </div>
          </motion.div>
        </div>

        <div className="h-24 mt-12 w-full flex items-center justify-center">
          <AnimatePresence>
            {isFlipped && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex gap-4 w-full max-w-2xl"
              >
                <button onClick={(e) => { e.stopPropagation(); handleReview(1); }} className="flex-1 bg-error-container/20 hover:bg-error-container/40 text-error py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors border border-error/10">
                  <span className="text-sm">Again</span>
                  <span className="text-[10px] opacity-60">(1)</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleReview(2); }} className="flex-1 bg-surface-container-highest hover:bg-surface-bright text-on-surface py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors">
                  <span className="text-sm">Hard</span>
                  <span className="text-[10px] opacity-60">(2)</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleReview(3); }} className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors border border-primary/20">
                  <span className="text-sm">Good</span>
                  <span className="text-[10px] opacity-60">(3)</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleReview(4); }} className="flex-1 bg-tertiary/20 hover:bg-tertiary/30 text-tertiary py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors border border-tertiary/20">
                  <span className="text-sm">Easy</span>
                  <span className="text-[10px] opacity-60">(4)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
