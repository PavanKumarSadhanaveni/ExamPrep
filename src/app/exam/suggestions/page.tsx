
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, UploadCloud } from "lucide-react";
import Link from "next/link";
import type React from "react";

export default function SuggestionPage() {
  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <CardTitle className="text-2xl font-semibold">AI Could Not Fully Analyze Your PDF</CardTitle>
          <CardDescription className="text-base">
            It seems our AI had trouble identifying distinct sections or the total number of questions.
            Here are some common reasons and potential solutions:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-1">1. PDF is Image-Based or Scanned</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> The PDF might be a scanned document or an image without selectable text. Our AI needs actual text to work with.</p>
            <p className="text-sm"><strong className="text-primary">Potential Solutions:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Try using an OCR (Optical Character Recognition) tool (many free online tools available) to convert your PDF to a text-selectable format before uploading.</li>
                <li>If possible, use an original digital PDF (e.g., one downloaded directly from a source, not a scan of a printout).</li>
              </ul>
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-1">2. Unconventional Formatting or Layout</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> The PDF might use unusual fonts, complex multi-column layouts, questions embedded in tables, or non-standard section headers (e.g., "Part 1: Verbal Ability" instead of a simpler "Section A: Verbal Ability").</p>
            <p className="text-sm"><strong className="text-primary">Potential Solutions:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Manual Edit (Recommended for Total Questions):</strong> On the "Exam Details" page (you can go back), try manually inputting the "Total Expected Questions" if you know this number. This helps the system, even if sections aren't auto-detected.</li>
                <li><strong>Simplify PDF (Advanced):</strong> If you have PDF editing software (like Adobe Acrobat Pro or free alternatives), try to simplify the layout, ensure text is selectable, or make section headers very clear and distinct (e.g., "Section A", "Section B: Physics").</li>
              </ul>
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-1">3. PDF is Corrupted or Password-Protected</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> The file might be damaged, or encrypted with a password that prevents text extraction.</p>
            <p className="text-sm"><strong className="text-primary">Potential Solutions:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Ensure the PDF opens correctly in a standard PDF viewer (like Adobe Reader or your browser).</li>
                <li>If it's password-protected for editing/copying, try to remove the password (if you're authorized) before uploading.</li>
              </ul>
            </p>
          </div>
          
           <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-1">4. Very Short PDF or Missing Key Exam Indicators</h3>
            <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Reason:</strong> The PDF might be too short (e.g., a single page with few questions), or lack typical exam indicators like "Total Marks", "Duration", clear question numbering, or distinct section divisions that the AI expects.</p>
            <p className="text-sm"><strong className="text-primary">Potential Solutions:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Double-check if you've uploaded the correct and complete exam paper.</li>
                 <li><strong>Manual Edit:</strong> As mentioned, if you know the "Total Expected Questions", please enter it on the Exam Details page.</li>
              </ul>
            </p>
          </div>

          <div className="pt-6 border-t mt-6">
            <h3 className="font-semibold text-lg mb-2">What to Do Now?</h3>
            <ul className="list-disc list-inside ml-4 space-y-2 text-sm">
              <li>
                You can <Link href="/exam/details" className="text-primary hover:underline font-medium">go back to the Exam Details page</Link>. 
                If you know the total number of questions, you can enter it manually. This might allow you to proceed even if sections were not automatically identified.
              </li>
              <li>
                You can <Link href="/" className="text-primary hover:underline font-medium">upload a different PDF</Link>. 
                Try a clearer, text-based version if possible.
              </li>
              <li>
                If the PDF seems to be text-based but sections weren't picked up, the AI might still extract questions and group them under a "General" category. 
                Check the "Exam Details" page to see if any questions were loaded under the first section.
              </li>
            </ul>
          </div>

        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6 mt-4 border-t">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/exam/details">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Exam Details
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload New PDF
              </Link>
            </Button>
          </CardFooter>
      </Card>
    </div>
  );
}
