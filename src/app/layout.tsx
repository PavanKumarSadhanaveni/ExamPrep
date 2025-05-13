
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ExamProvider } from '@/contexts/ExamContext';
import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import type React from 'react';
import CurrentYear from '@/components/app/CurrentYear';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ExamSim - AI Powered Exam Simulator',
  description: 'Upload your exam PDF and simulate test conditions with AI assistance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`} suppressHydrationWarning>
        <ExamProvider>
          <header className="bg-card border-b border-border sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
                <BookOpenCheck className="h-7 w-7" />
                ExamSim
              </Link>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
           <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
            © <CurrentYear /> ExamSim. All rights reserved.
          </footer>
        </ExamProvider>
      </body>
    </html>
  );
}
