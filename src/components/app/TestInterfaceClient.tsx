"use client";

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExamContext } from '@/hooks/useExamContext';
import QuestionCardClient from './QuestionCardClient';
import TimerDisplay from './TimerDisplay';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckSquare, PauseCircle, PlayCircle, AlertTriangle, SquareCheckBig, HelpCircle } from 'lucide-react';
import LoadingDots from './LoadingDots';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const TestInterfaceClient: React.FC = () => {
  const router = useRouter();
  const { examData, navigateToQuestion, submitExam, answerQuestion, isLoading, pauseExam, resumeExam } = useExamContext();
  const { questions, currentQuestionIndex, startTime, endTime, isPaused } = examData;

  useEffect(() => {
    if (!startTime && !endTime) {
      if (questions.length > 0) {
        router.replace('/exam/details');
      } else {
        router.replace('/');
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
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleNext = () => {
    if (isPaused) return;
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (isPaused) return;
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleSkip = () => {
    if (isPaused || !currentQuestion) return;
    answerQuestion(currentQuestion.id, null); 
    if (currentQuestionIndex < questions.length - 1) {
      handleNext();
    }
  };

  const handleSubmitExam = () => {
    if (isPaused) return;
    submitExam();
    router.push('/exam/results');
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      resumeExam();
    } else {
      pauseExam();
    }
  };
  
  const isExamFinished = !!endTime;

  return (
    <div className="flex flex-col h-full relative">
      {isPaused && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <PauseCircle className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-semibold">Exam Paused</h2>
          <p className="text-muted-foreground">Taking a break? Make sure to come back stronger 💪</p>
          <Button onClick={handlePauseToggle} size="lg">
            <PlayCircle className="mr-2 h-5 w-5" /> Resume Exam
          </Button>
        </div>
      )}
      <header className={cn("p-4 border-b bg-card shadow-sm", isPaused && "blur-sm pointer-events-none")}>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary">{examData.examInfo?.examName || "Exam"}</h1>
          <div className="flex items-center gap-2 md:gap-4">
            {!isExamFinished && <TimerDisplay />}
            {!isExamFinished && (
               <Button onClick={handlePauseToggle} variant="outline" size="sm">
                {isPaused ? <PlayCircle className="mr-0 md:mr-2 h-4 w-4" /> : <PauseCircle className="mr-0 md:mr-2 h-4 w-4" />}
                <span className="hidden md:inline">{isPaused ? "Resume" : "Pause"}</span>
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isExamFinished || isPaused} size="sm">
                  <SquareCheckBig className="mr-0 md:mr-2 h-4 w-4" /> 
                  <span className="hidden md:inline">Submit Exam</span>
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
        <p className="text-sm text-muted-foreground mt-1 text-right">
          Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
        </p>
      </header>

      <main className={cn("flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto", isPaused && "blur-sm pointer-events-none")}>
        {currentQuestion ? (
          <QuestionCardClient
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            isSubmitted={isExamFinished}
          />
        ) : (
           questions.length > 0 ? <p>Loading question...</p> : <p>No questions in this exam.</p>
        )}
      </main>

      <footer className={cn("p-4 border-t bg-card flex flex-col sm:flex-row justify-between items-center gap-4", isPaused && "blur-sm pointer-events-none")}>
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentQuestionIndex === 0 || isExamFinished || isPaused}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {!isExamFinished && currentQuestion && (
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            disabled={isPaused}
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="mr-2 h-4 w-4" /> Skip Question
          </Button>
        )}
        <Button 
          onClick={handleNext} 
          disabled={currentQuestionIndex === questions.length - 1 || isExamFinished || isPaused}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90"
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
};

export default TestInterfaceClient;
