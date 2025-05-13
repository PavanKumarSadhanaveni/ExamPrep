"use client";

import type React from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ExamErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Exam section error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-15rem)]">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-2xl">Oops! Something Went Wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected issue while loading this part of the exam.
            You can try to refresh or go back to the home page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If the problem persists, please contact support.
          </p>
          {error?.message && (
            <details className="mt-4 p-2 bg-secondary/30 rounded-md text-xs text-left">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={() => reset()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
