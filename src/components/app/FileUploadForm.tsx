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
import { extractExamInfoAction, extractQuestionsAction } from '@/actions/examActions';
import LoadingDots from './LoadingDots';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import type { Question, ExtractedQuestionInfo } from '@/types/exam';

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
  const { setPdfTextContent, setExamInfo, setQuestions, setIsLoading, isLoading } = useExamContext();
  const [currentProcess, setCurrentProcess] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setCurrentProcess("Processing PDF...");

    const file = data.pdfFile[0];

    try {
      const pdfText = await extractTextFromPdf(file);
      if (!pdfText.trim()) {
        throw new Error("Could not extract any text from the PDF. It might be image-based or corrupted.");
      }
      setPdfTextContent(pdfText);
      setCurrentProcess("Extracting exam information...");

      const examInfoResult = await extractExamInfoAction(pdfText);
      
      if ('error' in examInfoResult) {
        throw new Error(`Exam Info Error: ${examInfoResult.error}`);
      }
      setExamInfo(examInfoResult);
      toast({
        title: "Exam Info Extracted",
        description: "Successfully extracted exam metadata.",
      });

      setCurrentProcess("Extracting questions...");
      const questionsResult = await extractQuestionsAction({
        pdfTextContent: pdfText,
        sections: examInfoResult.sections && examInfoResult.sections.length > 0 ? examInfoResult.sections : ["General"],
      });

      if ('error' in questionsResult) {
        // Non-critical error for questions, allow user to proceed with exam info.
        // They can use mock questions or be informed.
        toast({
          title: "Question Extraction Issue",
          description: `${questionsResult.error} Mock questions might be used if available.`,
          variant: "default", // Not destructive as exam info is still there.
        });
        // Set empty questions or let context handle mock generation if desired.
        // For now, let's set empty and let ExamDetailsDisplay handle it.
        setQuestions([]);
      } else {
        const appQuestions: Question[] = questionsResult.questions.map((q: ExtractedQuestionInfo, index: number) => ({
          id: `q-${Date.now()}-${index}`, // More unique ID
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswerText,
          section: q.section,
          originalPdfQuestionNumber: q.originalQuestionNumber,
        }));
        setQuestions(appQuestions);
        toast({
          title: "Questions Extracted",
          description: `Successfully extracted ${appQuestions.length} questions.`,
        });
      }
      
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
          Upload your exam paper in PDF format. We'll extract the details and questions for your practice test.
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
              <LoadingDots text={currentProcess || "Processing..."} />
            )}
            {error && !isLoading && ( // Only show general error if not loading, specific toasts handle other cases
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
