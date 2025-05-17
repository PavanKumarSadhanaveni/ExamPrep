
"use client";

import React, { useEffect, useState, useCallback } from 'react'; // Import React
import { useRouter } from 'next/navigation';
import { useExamContext } from '@/hooks/useExamContext';
import QuestionCardClient from './QuestionCardClient';
import TimerDisplay from './TimerDisplay';
import HintBot from './HintBot'; // Import HintBot
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckSquare, PauseCircle, PlayCircle, AlertTriangle, SquareCheckBig, HelpCircle, Loader2 } from 'lucide-react';
import LoadingDots from './LoadingDots';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const TestInterfaceClient: React.FC = () => {
  const router = useRouter();
  const { 
    examData, 
    navigateToQuestion: contextNavigateToQuestion, 
    submitExam: contextSubmitExam, 
    answerQuestion: contextAnswerQuestion, 
    isLoading: contextIsLoading,
    pauseExam: contextPauseExam, 
    resumeExam: contextResumeExam,
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
      if (examInfo && examInfo.sections && examInfo.sections.length > 0 && sectionsExtracted.includes(examInfo.sections[0])) {
         if (questions.filter(q => q.section === examInfo.sections[0]).length > 0) {
            setIsPageLoading(false);
            return;
         }
      }
      toast({ title: "Exam Not Ready", description: "Please start the exam from the details page.", variant: "destructive" });
      router.replace('/exam/details');
      return;
    }
    if (endTime) {
      router.replace('/exam/results');
      return;
    }
    setIsPageLoading(false);
  }, [examInfo, questions, startTime, endTime, sectionsExtracted, router, toast]);


  useEffect(() => {
    if (!examInfo || !currentSection || endTime || isPaused || !Array.isArray(examInfo.sections)) return;

    const currentSectionIndex = examInfo.sections.indexOf(currentSection);
    if (currentSectionIndex === -1 || currentSectionIndex >= examInfo.sections.length - 1) {
      return; 
    }

    const nextSectionName = examInfo.sections[currentSectionIndex + 1];
    if (nextSectionName && !sectionsExtracted.includes(nextSectionName) && sectionBeingExtracted !== nextSectionName) {
      extractQuestionsForSection(nextSectionName).then(success => {
        if (success) {
          toast({ title: "Next Section Ready", description: `${nextSectionName} questions are now available.`});
        } else {
          toast({ title: "Next Section Load Issue", description: `Could not load questions for ${nextSectionName}. You can try navigating to it manually later.`, variant:"default", duration: 6000});
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


  const currentQuestion = questions[currentQuestionIndex];
  const isCurrentSectionLoadingQuestions = sectionBeingExtracted === currentSection && !sectionsExtracted.includes(currentSection || "");

  const handleNext = useCallback(() => {
    if (isPaused || !currentQuestion) return;
    if (currentQuestionIndex < questions.length - 1) {
      contextNavigateToQuestion(currentQuestionIndex + 1);
    } else {
        toast({ title: "End of Loaded Questions", description: "You've reached the end of currently loaded questions. More may be loading, or you can submit."})
    }
  }, [isPaused, currentQuestion, currentQuestionIndex, questions.length, contextNavigateToQuestion, toast]);

  const handlePrevious = useCallback(() => {
    if (isPaused || !currentQuestion) return;
    if (currentQuestionIndex > 0) {
      contextNavigateToQuestion(currentQuestionIndex - 1);
    }
  }, [isPaused, currentQuestion, currentQuestionIndex, contextNavigateToQuestion]);

  const handleSkip = useCallback(() => {
    if (isPaused || !currentQuestion) return;
    contextAnswerQuestion(currentQuestion.id, null); 
    if (currentQuestionIndex < questions.length - 1) {
      handleNext();
    } else {
       toast({ title: "Skipped Last Loaded Question", description: "This was the last loaded question. You can submit or wait for more."})
    }
  }, [isPaused, currentQuestion, contextAnswerQuestion, currentQuestionIndex, questions.length, handleNext, toast]);

  const handleSubmitExam = useCallback(() => {
    if (isPaused) return;
    contextSubmitExam();
    router.push('/exam/results');
  }, [isPaused, contextSubmitExam, router]);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      contextResumeExam();
    } else {
      contextPauseExam();
    }
  }, [isPaused, contextResumeExam, contextPauseExam]);
  
  if (isPageLoading || (contextIsLoading && !currentSection)) return <LoadingDots text="Loading exam interface..." />;

  if (!currentQuestion && !isCurrentSectionLoadingQuestions && examInfo?.sections?.length > 0) {
    const questionsForCurrentSection = questions.filter(q => q.section === currentSection).length;
    const isCurrentSectionLoaded = sectionsExtracted.includes(currentSection || "");

     return (
      <div className="text-center py-10 flex flex-col items-center justify-center h-full">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="mt-4 text-xl font-semibold">
          {isCurrentSectionLoaded && questionsForCurrentSection === 0 
            ? `No Questions Found for ${currentSection}` 
            : `No Questions Available for ${currentSection}`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {isCurrentSectionLoaded && questionsForCurrentSection === 0
            ? `The AI could not extract any questions for the section "${currentSection}".`
            : `Questions for "${currentSection}" are not loaded yet.`
          }
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          You can try navigating to another section using the sidebar, or if this is the first section, please check the exam details.
        </p>
        <Button onClick={() => router.push('/exam/details')} className="mt-6">
          Back to Exam Details
        </Button>
      </div>
    );
  }
  
  if (isCurrentSectionLoadingQuestions) {
    return <LoadingDots text={`Loading questions for ${currentSection}...`} />;
  }

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const overallProgress = examInfo?.overallNumberOfQuestions && examInfo.overallNumberOfQuestions > 0 && Array.isArray(examInfo.sections)
    ? (questions.length / examInfo.overallNumberOfQuestions) * 100 
    : (Array.isArray(examInfo?.sections) && examInfo.sections.length > 0 ? (sectionsExtracted.length / examInfo.sections.length) * 100 : 0);

  const isExamFinished = !!endTime;

  return (
    <div className="flex flex-col h-full relative">
      {isPaused && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 p-4 text-center">
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
          <h1 className="text-xl font-semibold text-primary truncate" title={examData.examInfo?.examName || "Exam"}>{examData.examInfo?.examName || "ExamPrep"}</h1>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {!isExamFinished && <TimerDisplay />}
            {!isExamFinished && (
               <Button onClick={handlePauseToggle} variant="outline" size="sm" aria-label={isPaused ? "Resume Exam" : "Pause Exam"}>
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
            Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length} (Loaded so far)
            </p>
            {examInfo?.overallNumberOfQuestions && examInfo.overallNumberOfQuestions > 0 && Array.isArray(examInfo.sections) && examInfo.sections.length > 0 && (
                 <>
                 <Progress value={overallProgress} className="h-1 bg-secondary/50" title={`Overall progress: ${questions.length} of ${examInfo.overallNumberOfQuestions || 'many'} expected questions loaded`} />
                 <p className="text-xs text-muted-foreground text-right">
                    Overall: {sectionsExtracted.length} of {examInfo.sections.length} sections ({questions.length} of ~{examInfo.overallNumberOfQuestions || sectionsExtracted.length * (examInfo.overallNumberOfQuestions / examInfo.sections.length || 10) } Qs) loaded
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
           questions.length > 0 && !isCurrentSectionLoadingQuestions ? <LoadingDots text="Loading question data..." /> : 
           !isCurrentSectionLoadingQuestions && <div className="text-center py-10">
             <AlertTriangle className="mx-auto h-12 w-12 text-orange-400" />
             <h2 className="mt-4 text-xl font-semibold">No Active Question</h2>
             <p className="mt-2 text-muted-foreground">
               Please select a section or question from the navigator.
             </p>
             {sectionBeingExtracted && <LoadingDots text={`Extracting ${sectionBeingExtracted}...`} className="mt-4"/>}
           </div>
        )}
      </main>

      <footer className={cn("p-4 border-t bg-card flex flex-col sm:flex-row justify-between items-center gap-4", isPaused && "blur-sm pointer-events-none")}>
        <div className="flex-1 hidden sm:block">
           {/* Space for future elements or just a spacer */}
        </div>
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 w-full sm:w-auto">
            {currentQuestion && !isExamFinished && !isPaused && (
              <HintBot currentQuestion={currentQuestion} isExamFinished={isExamFinished} />
            )}
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentQuestionIndex === 0 || isExamFinished || isPaused || isCurrentSectionLoadingQuestions || !currentQuestion}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {!isExamFinished && currentQuestion && (
              <Button 
                  variant="ghost" 
                  onClick={handleSkip}
                  disabled={isPaused || isCurrentSectionLoadingQuestions || !currentQuestion}
                  className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
              >
                  <HelpCircle className="mr-2 h-4 w-4" /> Skip Question
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              disabled={!currentQuestion || currentQuestionIndex === questions.length - 1 || isExamFinished || isPaused || isCurrentSectionLoadingQuestions}
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

