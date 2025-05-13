"use client";

import type React from 'react';
import { useState, useCallback } from 'react';
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
import { extractExamInfoAction } from '@/actions/examActions';
import LoadingDots from './LoadingDots';
import { UploadCloud, AlertTriangle } from 'lucide-react';

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
  const { setPdfTextContent, setExamInfo, setIsLoading, isLoading } = useExamContext();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    const file = data.pdfFile[0];

    try {
      const pdfText = await extractTextFromPdf(file);
      if (!pdfText.trim()) {
        throw new Error("Could not extract any text from the PDF. It might be image-based or corrupted.");
      }
      setPdfTextContent(pdfText);

      const aiResult = await extractExamInfoAction(pdfText);
      
      if ('error' in aiResult) {
        throw new Error(aiResult.error);
      }

      setExamInfo(aiResult);
      toast({
        title: "Exam Info Extracted",
        description: "Successfully processed your exam PDF.",
      });
      router.push('/exam/details');
    } catch (err: any) {
      console.error("Error processing PDF:", err);
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          Upload your exam paper in PDF format. We'll extract the details and set up your practice test.
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
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isLoading && (
              <LoadingDots text="Processing PDF and extracting exam info... This may take a moment." />
            )}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Upload and Analyze'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default FileUploadForm;
