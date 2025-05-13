"use client";

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useExamContext } from '@/hooks/useExamContext';
import { extractTextFromPdf } from '@/lib/pdfUtils';
import { extractExamInfoAction } from '@/actions/examActions'; // extractQuestionsAction removed from direct call here
import LoadingDots from './LoadingDots';
import { UploadCloud, AlertTriangle } from 'lucide-react';
// Question types are handled by context now

const formSchema = z.object({
  pdfFile: z
    .custom<FileList>()
    .refine((files) => files && files.length === 1, "Exam PDF is required.")
    .refine((files) => files && files[0]?.type === "application/pdf", "File must be a PDF.")
    .refine((files) => files && files[0]?.size <= 10 * 1024 * 1024, "File size must be less than 10MB."),
});

type FormData = z.infer<typeof formSchema>;

const FileUploadForm: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { setPdfTextContent, setExamInfo, setIsLoading, isLoading, extractQuestionsForSection } = useExamContext();
  const [currentProcess, setCurrentProcess] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true); // General loading for PDF processing
    setError(null);
    setCurrentProcess("Processing PDF... This may take a moment, especially for scanned documents.");

    const file = data.pdfFile[0];

    try {
      const pdfText = await extractTextFromPdf(file);
      if (!pdfText.trim()) {
        throw new Error("Could not extract any text from the PDF. It might be image-based, corrupted, or empty. OCR was attempted if applicable.");
      }
      setPdfTextContent(pdfText); // This also resets sectionsExtracted in context
      
      toast({
          title: "PDF Processed",
          description: "Text extracted. If it was a scanned PDF, OCR was attempted. Now analyzing content...",
          duration: 7000,
      });

      setCurrentProcess("Extracting exam information...");
      const examInfoResult = await extractExamInfoAction(pdfText);
      
      if ('error' in examInfoResult) {
        throw new Error(`Exam Info Error: ${examInfoResult.error}`);
      }
      setExamInfo(examInfoResult); // This sets examInfo and currentSection to first section
      toast({
        title: "Exam Info Extracted",
        description: "Successfully extracted exam metadata.",
      });

      // Now, extract questions only for the first section
      if (examInfoResult.sections && examInfoResult.sections.length > 0) {
        const firstSectionName = examInfoResult.sections[0];
        setCurrentProcess(`Extracting questions for: ${firstSectionName}...`);
        
        const success = await extractQuestionsForSection(firstSectionName); // This uses context's own loading states (sectionBeingExtracted)
        
        if (!success) {
           toast({
            title: `Question Extraction Issue for ${firstSectionName}`,
            description: `Could not load questions for the first section. You can try again from the exam details page or proceed if other sections load.`,
            variant: "default",
          });
          // Proceed to details page anyway, user can try to load sections from there or see errors.
        }
      } else {
        toast({
          title: "No Sections Identified by AI",
          description: "AI could not identify distinct sections. Please review the extracted details. If no questions are found, manual entry or a different PDF might be needed.",
          variant: "default",
          duration: 7000,
          });
      }
      
      router.push('/exam/details');

    } catch (err: any)
     {
      console.error("Error processing PDF:", err);
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // General loading finished
      setCurrentProcess("");
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <UploadCloud className="h-7 w-7 text-primary" />
          Upload Your Exam PDF
        </CardTitle>
        <CardDescription>
          Upload your exam paper (max 10MB). We'll extract details and start loading questions section by section. Scanned PDFs may take longer due to OCR.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="pdfFile"
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <FormItem>
                  <FormLabel htmlFor="pdfFile">Exam PDF (Max 10MB)</FormLabel>
                  <FormControl>
                    <Input
                      id="pdfFile"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => onChange(e.target.files)}
                      onBlur={onBlur}
                      name={name}
                      ref={ref}
                      className="file:text-primary file:font-semibold hover:file:bg-primary/10"
                      disabled={isLoading} // General loading for PDF processing
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isLoading && ( // This is the general PDF processing loader
              <LoadingDots text={currentProcess || "Processing..."} />
            )}
            {error && !isLoading && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (currentProcess || 'Processing...') : 'Upload and Analyze'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default FileUploadForm;
