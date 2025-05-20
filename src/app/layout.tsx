
"use client";

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ExamProvider } from '@/contexts/ExamContext';
import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import type React from 'react';
import CurrentYear from '@/components/app/CurrentYear';
import { useEffect, useState } from 'react';
import DarkModeToggle from '@/components/app/DarkModeToggle';
import ProjectInfoModal from '@/components/app/ProjectInfoModal'; // Import the new modal


// Font loaders must be called and assigned to a const in the module scope
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata defined here will not be automatically picked up by Next.js
// for static generation because this is a Client Component.
// To set metadata for SEO, it should be exported from a Server Component.
// For now, we'll keep it simple. If SEO is critical, this metadata object
// should be moved to a server component (e.g., a new src/app/metadata.ts or similar strategy)
// For the purpose of this layout being a client component, we acknowledge static metadata here
// won't be used by Next.js for generation but can be used for dynamic title setting if needed.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Example of how you could set title dynamically if needed from a client component
    // document.title = "ExamPrep - AI Powered Exam Simulator";
  }, []);


  if (!isMounted) {
    // Consistent fallback to avoid hydration issues with dynamic classes
    // Using suppressHydrationWarning on html and body
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>Loading ExamPrep...</title>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </head>
        <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
          <div className="flex-grow container mx-auto px-4 py-8 text-center">Loading application...</div>
        </body>
      </html>
    );
  }

  const bodyClassName = `${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ExamPrep - AI Powered Exam Simulator</title>
        <meta name="description" content="Upload your exam PDF and simulate test conditions with AI assistance." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={bodyClassName} suppressHydrationWarning>
        <ExamProvider>
          <header className="bg-card border-b border-border sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
                <BookOpenCheck className="h-7 w-7" />
                ExamPrep
              </Link>
              <div className="flex items-center gap-1">
                <ProjectInfoModal />
                <DarkModeToggle />
              </div>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
           <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
            © <CurrentYear /> ExamPrep. All rights reserved.
          </footer>
        </ExamProvider>
      </body>
    </html>
  );
}
