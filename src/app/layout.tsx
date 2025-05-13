
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
const metadata: Metadata = {
  title: 'ExamSim - AI Powered Exam Simulator',
  description: 'Upload your exam PDF and simulate test conditions with AI assistance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // If dynamic title/description setting is needed from this client component, it can be done here:
    // document.title = metadata.title as string;
    // const metaDescriptionTag = document.querySelector('meta[name="description"]');
    // if (metaDescriptionTag && metadata.description) {
    //   metaDescriptionTag.setAttribute('content', metadata.description);
    // }
  }, []);

  // Render a fallback or null until component is mounted
  // This helps prevent hydration mismatches with classNames or client-side logic.
  // The font variables are now from module scope, so `fontVariables` state is not needed.
  if (!isMounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Basic title for initial load, will be overridden if using document.title */}
          <title>Loading ExamSim...</title>
        </head>
        {/* Use a generic body class for the fallback to avoid potential mismatches before full client mount */}
        <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
          <div className="flex-grow container mx-auto px-4 py-8 text-center">Loading application...</div>
        </body>
      </html>
    );
  }

  // Construct the className string for the body tag using the module-scoped font variables.
  const bodyClassName = `${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName} suppressHydrationWarning>
        <ExamProvider>
          <header className="bg-card border-b border-border sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
                <BookOpenCheck className="h-7 w-7" />
                ExamSim
              </Link>
              <DarkModeToggle />
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

