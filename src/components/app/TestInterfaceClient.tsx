"use client";

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExamContext } from '@/hooks/useExamContext';
import QuestionCardClient from './QuestionCardClient';
import TimerDisplay from './TimerDisplay';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckSquare, PauseCircle, AlertTriangle, SquareCheckBig } from 'lucide-react';
import LoadingDots from './LoadingDots';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const TestInterfaceClient: React.FC = () => {
  const router = useRouter();
  const { examData, navigateToQuestion, submitExam, answerQuestion, isLoading, setIsLoading } = useExamContext();
  const { questions, currentQuestionIndex, startTime, endTime } = examData;

  useEffect(() => {
    // If exam hasn't started (e.g. direct navigation or page refresh without state restoration)
    // or if questions are not loaded, redirect to details or upload.
    if (!startTime && !endTime) { // Exam not started and not finished
      if (questions.length > 0) {
        // This case might mean context was reloaded, if questions exist but no startTime.
        // Consider redirecting or re-initializing startExam, for now redirect to details.
        router.replace('/exam/details');
      } else {
        router.replace('/'); // No questions, redirect to upload
      }
    }
  }, [questions, startTime, endTime, router]);


  if (isLoading) return <LoadingDots text="Loading exam questions..." />;
  if (!questions || questions.length === 0) {
     return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">No Questions Loaded</h2>
        <p className="mt-2 text-muted-foreground">
          There are no questions available for this exam. Please try uploading the PDF again.
        </p>
        <Button onClick={() => router.push('/')} className="mt-6">
          Go to Upload
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleSkip = () => {
    answerQuestion(currentQuestion.id, null); // Mark as skipped
    if (currentQuestionIndex < questions.length - 1) {
      handleNext();
    } else {
      // If it's the last question and skipped, user might want to submit
      // Or stay on the page, for now, just mark as skipped.
    }
  };

  const handleSubmitExam = () => {
    submitExam();
    router.push('/exam/results');
  };
  
  const isExamFinished = !!endTime;

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b bg-card shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary">{examData.examInfo?.examName || "Exam"}</h1>
          <div className="flex items-center gap-4">
            {!isExamFinished && <TimerDisplay />}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isExamFinished}>
                  <CheckSquare className="mr-2 h-4 w-4" /> Submit Exam
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Once submitted, you cannot change your answers. Your results will be calculated.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmitExam} className="bg-primary hover:bg-primary/90">
                    Confirm Submit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <Progress value={progress} className="mt-3 h-2" />
        <p className="text-sm text-muted-foreground mt-1 text-right">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </header>

      <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
        {currentQuestion ? (
          <QuestionCardClient
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            isSubmitted={isExamFinished}
          />
        ) : (
          <p>Loading question...</p>
        )}
      </main>

      <footer className="p-4 border-t bg-card flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentQuestionIndex === 0 || isExamFinished}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {!isExamFinished && (
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
          >
            Skip Question
          </Button>
        )}
        <Button 
          onClick={handleNext} 
          disabled={currentQuestionIndex === questions.length - 1 || isExamFinished}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90"
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
};

export default TestInterfaceClient;
