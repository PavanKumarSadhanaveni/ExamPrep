
"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExamContext } from '@/hooks/useExamContext';
import QuestionCardClient from './QuestionCardClient';
import TimerDisplay from './TimerDisplay';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckSquare, PauseCircle, PlayCircle, AlertTriangle, SquareCheckBig, HelpCircle, Loader2, Info } from 'lucide-react';
import LoadingDots from './LoadingDots';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const TestInterfaceClient: React.FC = () => {
  const router = useRouter();
  const { 
    examData, 
    navigateToQuestion, 
    submitExam, 
    answerQuestion, 
    isLoading: contextIsLoading,
    pauseExam, 
    resumeExam,
    extractQuestionsForSection,
    sectionsExtracted,
    sectionBeingExtracted
  } = useExamContext();
  const { toast } = useToast();

  const { questions, currentQuestionIndex, startTime, endTime, isPaused, examInfo, currentSection, userAnswers } = examData;
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [unattemptedQuestionsCount, setUnattemptedQuestionsCount] = useState(0);


  useEffect(() => {
    setIsPageLoading(true);
    if (!startTime && !endTime) { 
      if (examInfo && examInfo.sections.length > 0 && sectionsExtracted.includes(examInfo.sections[0])) {
         if (questions.filter(q => q.section === examInfo.sections[0]).length > 0) {
            setIsPageLoading(false);
            return;
         }
      }
      toast({ title: "Exam Not Ready", description: "Please start the exam from the details page.", variant: "destructive" });
      router.replace('/exam/details');
      return;
    }
    setIsPageLoading(false);
  }, [examInfo, questions, startTime, endTime, sectionsExtracted, router, toast]);


  useEffect(() => {
    if (!examInfo || !currentSection || endTime || isPaused) return;

    const currentSectionIndex = examInfo.sections.indexOf(currentSection);
    if (currentSectionIndex === -1 || currentSectionIndex >= examInfo.sections.length - 1) {
      return; 
    }

    const nextSectionName = examInfo.sections[currentSectionIndex + 1];
    if (nextSectionName && !sectionsExtracted.includes(nextSectionName) && sectionBeingExtracted !== nextSectionName) {
      extractQuestionsForSection(nextSectionName).then(success => {
        if (success) {
          toast({ title: "Next Section Ready", description: `${nextSectionName} questions are now available.`});
        }
      });
    }
  }, [currentSection, examInfo, sectionsExtracted, sectionBeingExtracted, extractQuestionsForSection, endTime, isPaused, toast]);

  useEffect(() => {
    if (questions.length > 0) {
      const unattempted = userAnswers.filter(ans => ans.selectedOption === null).length;
      setUnattemptedQuestionsCount(unattempted);
    } else {
      setUnattemptedQuestionsCount(0);
    }
  }, [userAnswers, questions.length]);


  if (isPageLoading || contextIsLoading) return <LoadingDots text="Loading exam interface..." />;
  
  const currentQuestion = questions[currentQuestionIndex];
  const isCurrentSectionLoading = sectionBeingExtracted === currentSection && !sectionsExtracted.includes(currentSection || "");

  if (!currentQuestion && !isCurrentSectionLoading && questions.length === 0 && examInfo?.sections?.length > 0) {
     return (
      <div className="text-center py-10 flex flex-col items-center justify-center h-full">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="mt-4 text-xl font-semibold">No Questions Available</h2>
        <p className="mt-2 text-muted-foreground">
          Questions for the section "{currentSection}" are not yet loaded or could not be found.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try navigating to another section, or check notifications for loading status.
        </p>
        <Button onClick={() => router.push('/exam/details')} className="mt-6">
          Back to Exam Details
        </Button>
      </div>
    );
  }
  
  if (isCurrentSectionLoading) {
    return <LoadingDots text={`Loading questions for ${currentSection}...`} />;
  }


  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const overallProgress = examInfo?.numberOfQuestions 
    ? (questions.length / examInfo.numberOfQuestions) * 100 
    : (sectionsExtracted.length / (examInfo?.sections?.length || 1)) * 100;


  const handleNext = () => {
    if (isPaused) return;
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    } else {
        toast({ title: "End of Loaded Questions", description: "You've reached the end of currently loaded questions. More may be loading."})
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
                    {unattemptedQuestionsCount > 0 && (
                      <span className="block mb-2 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="inline h-4 w-4 mr-1" />
                        You have {unattemptedQuestionsCount} unattempted question{unattemptedQuestionsCount > 1 ? 's' : ''}. 
                      </span>
                    )}
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
        <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-2" title={`Question ${currentQuestionIndex + 1} of ${questions.length} loaded`}/>
            <p className="text-xs text-muted-foreground text-right">
            Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length} (Loaded)
            </p>
            {examInfo?.numberOfQuestions && examInfo.numberOfQuestions > questions.length && (
                 <>
                 <Progress value={overallProgress} className="h-1 bg-secondary/50" title={`Overall progress: ${questions.length} of ${examInfo.numberOfQuestions} expected questions loaded`} />
                 <p className="text-xs text-muted-foreground text-right">
                    Overall: {sectionsExtracted.length} of {examInfo.sections.length} sections ({questions.length} of ~{examInfo.numberOfQuestions} Qs) loaded
                 </p>
                 </>
            )}
        </div>
      </header>

      <main className={cn("flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto", isPaused && "blur-sm pointer-events-none")}>
        {currentQuestion ? (
          <QuestionCardClient
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            isSubmitted={isExamFinished}
          />
        ) : (
           questions.length > 0 ? <p>Loading question...</p> : 
           <div className="text-center py-10">
             <AlertTriangle className="mx-auto h-12 w-12 text-orange-400" />
             <h2 className="mt-4 text-xl font-semibold">No Questions For This Section Yet</h2>
             <p className="mt-2 text-muted-foreground">
               Questions for "{currentSection}" might still be loading or none were found.
             </p>
             {sectionBeingExtracted === currentSection && <LoadingDots text={`Extracting ${currentSection}...`} className="mt-4"/>}
           </div>
        )}
      </main>

      <footer className={cn("p-4 border-t bg-card flex flex-col sm:flex-row justify-between items-center gap-4", isPaused && "blur-sm pointer-events-none")}>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Info size={14} /> After submission: <span className="text-green-600 font-medium">Correct</span>, <span className="text-red-600 font-medium">Incorrect</span>, <span className="text-yellow-600 font-medium">Skipped</span>.
        </div>
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 w-full sm:w-auto">
            <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentQuestionIndex === 0 || isExamFinished || isPaused || isCurrentSectionLoading}
            className="w-full sm:w-auto"
            >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {!isExamFinished && currentQuestion && (
            <Button 
                variant="ghost" 
                onClick={handleSkip}
                disabled={isPaused || isCurrentSectionLoading}
                className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
            >
                <HelpCircle className="mr-2 h-4 w-4" /> Skip Question
            </Button>
            )}
            <Button 
            onClick={handleNext} 
            disabled={!currentQuestion || currentQuestionIndex === questions.length - 1 || isExamFinished || isPaused || isCurrentSectionLoading}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
            Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </footer>
    </div>
  );
};

export default TestInterfaceClient;

