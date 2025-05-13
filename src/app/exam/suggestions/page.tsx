
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, UploadCloud, Mail } from "lucide-react";
import Link from "next/link";
import type React from "react";

export default function SuggestionPage() {
  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <CardTitle className="text-2xl font-semibold">Uh-oh! We couldn’t extract any data from your PDF 😕</CardTitle>
          <CardDescription className="text-base">
            No sections were found, total questions = N/A, and basically... it’s a blank slate. 
            But don’t stress — here’s what <strong className="text-foreground">might’ve gone wrong</strong> and how you can <strong className="text-primary">fix it</strong> 👇
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-1">1. PDF Formatting is Weird (Scanned or Image-Based)</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> Some PDFs are just scans or images, not real text. Our AI needs actual text to work with.</p>
            <p className="text-sm"><strong className="text-primary">Quick Fix:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Try uploading a PDF that has <strong className="text-foreground">selectable text</strong>, not just screenshots or photos.</li>
                <li>Use an OCR (Optical Character Recognition) tool (many free online!) to convert your PDF to a text-selectable format before uploading.</li>
              </ul>
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-1">2. Low-Quality PDF</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> Blurry, distorted, or very small text PDFs confuse our system big time.</p>
            <p className="text-sm"><strong className="text-primary">Quick Fix:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Re-upload a <strong className="text-foreground">clearer, higher-resolution version</strong> of the PDF.</li>
                <li>Ensure the text is legible when you open it normally.</li>
              </ul>
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-1">3. Question/Section Format Not Recognized</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> If the questions, options, or sections aren’t in a standard, clear format (like "Section A", "Q1.", MCQs with "A.", "B.", "C.", "D."), we might miss them.</p>
            <p className="text-sm"><strong className="text-primary">Quick Fix:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Try using <strong className="text-foreground">another paper or version</strong> with more common formatting for exams.</li>
                <li>If you have PDF editing tools, try to make section headers distinct (e.g., "SECTION A: Physics") and question numbering clear.</li>
              </ul>
            </p>
          </div>
          
           <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-1">4. Password-Protected PDF</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> If the file’s locked or restricted for copying/editing, we can't peek inside to get the text.</p>
            <p className="text-sm"><strong className="text-primary">Quick Fix:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Remove the password or restrictions before uploading (if you're authorized to, of course!).</li>
              </ul>
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-1">5. Blank or Corrupted PDF</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> The file might be damaged, actually empty, or not a valid PDF at all.</p>
            <p className="text-sm"><strong className="text-primary">Quick Fix:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Double-check the file. Open it in a PDF viewer to see if it's okay.</li>
                <li>Maybe re-download it or get it from a different source.</li>
              </ul>
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-1">6. Unsupported Language or Complex Symbols</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> If it’s in a language other than English or full of very complex mathematical/scientific symbols not embedded as text, it might mess with our system.</p>
            <p className="text-sm"><strong className="text-primary">Quick Fix:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>For now, use PDFs with <strong className="text-foreground">standard English text</strong> for best results.</li>
                <li>Ensure symbols are part of the text flow, not images.</li>
              </ul>
            </p>
          </div>

          <div className="pt-6 border-t mt-6">
            <h3 className="font-semibold text-lg mb-2 text-primary">💡 What You Can Do Now</h3>
            <ul className="list-disc list-inside ml-4 space-y-3 text-sm">
              <li>
                You can <Link href="/" className="text-primary hover:underline font-medium">go back and try uploading a different PDF</Link>. 
                A clearer, text-based version usually works best!
              </li>
              <li>
                Or, you can <Link href="/exam/details" className="text-primary hover:underline font-medium">head to the Exam Details page</Link>. 
                If you know the exam info (like total questions, duration), you can try manually filling it in to proceed. This might let you use the exam interface even if we couldn't auto-detect everything.
              </li>
              <li>
                Still stuck? <Link href="mailto:support@example.com" className="text-primary hover:underline font-medium flex items-center gap-1">
                    <Mail size={16}/> Hit us up with the PDF at support@example.com
                </Link> and we’ll try to help you out!
              </li>
            </ul>
          </div>

        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 mt-4 border-t">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/exam/details">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Exam Details (Manual Entry)
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Different PDF
              </Link>
            </Button>
          </CardFooter>
      </Card>
    </div>
  );
}

