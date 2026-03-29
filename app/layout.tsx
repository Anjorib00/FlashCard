import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'FlashMind',
  description: 'The Digital Sanctuary for Flashcards',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${manrope.variable}`}>
      <body className="bg-surface text-on-surface font-body antialiased selection:bg-primary/30" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
