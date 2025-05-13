
"use client";

import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import type { ExamData, Question, UserAnswer, ExtractExamInfoOutput, ExtractedQuestionInfo } from '@/types/exam';
import { extractQuestionsAction } from '@/actions/examActions'; // Import the action
import { useToast } from '@/hooks/use-toast';

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  // Fisher-Yates shuffle algorithm
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

interface ExamContextType {
  examData: ExamData;
  setPdfTextContent: (text: string) => void;
  setExamInfo: (info: ExtractExamInfoOutput) => void;
  startExam: () => void;
  answerQuestion: (questionId: string, selectedOption: string | null) => void;
  navigateToQuestion: (questionIndex: number) => void;
  navigateToSection: (sectionName: string) => Promise<void>;
  submitExam: () => void;
  resetExam: () => void;
  pauseExam: () => void;
  resumeExam: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  sectionBeingExtracted: string | null;
  sectionsExtracted: string[];
  extractQuestionsForSection: (sectionName: string) => Promise<boolean>;
  totalQuestionsAcrossAllSections: number;
}

const initialExamData: ExamData = {
  pdfTextContent: null,
  examInfo: null,
  questions: [],
  currentSection: null,
  currentQuestionIndex: 0,
  userAnswers: [],
  startTime: null,
  endTime: null,
  isPaused: false,
};

export const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [examData, setExamDataState] = useState<ExamData>(initialExamData);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sectionBeingExtracted, setSectionBeingExtracted] = useState<string | null>(null);
  const [sectionsExtracted, setSectionsExtracted] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedExamData = localStorage.getItem('examData');
    const storedSectionsExtracted = localStorage.getItem('sectionsExtracted');
    if (storedExamData) {
      try {
        const parsedData = JSON.parse(storedExamData) as ExamData;
        if (parsedData.startTime || parsedData.endTime) {
             setExamDataState({
                ...initialExamData,
                ...parsedData,
                isPaused: false, 
             });
             if (storedSectionsExtracted) {
                setSectionsExtracted(JSON.parse(storedSectionsExtracted));
             }
        } else {
            setExamDataState(prev => ({
                ...prev,
                pdfTextContent: parsedData.pdfTextContent,
                examInfo: parsedData.examInfo,
                questions: parsedData.questions || [], // Restore questions if they were pre-shuffled and stored
                userAnswers: parsedData.userAnswers || [],
                currentQuestionIndex: parsedData.currentQuestionIndex || 0,
                currentSection: parsedData.currentSection || parsedData.examInfo?.sections?.[0] || null,
            }));
             if (storedSectionsExtracted) {
                setSectionsExtracted(JSON.parse(storedSectionsExtracted));
             } else {
                setSectionsExtracted([]);
             }
        }
      } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.removeItem('examData');
        localStorage.removeItem('sectionsExtracted');
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('examData', JSON.stringify(examData));
      localStorage.setItem('sectionsExtracted', JSON.stringify(sectionsExtracted));
    }
  }, [examData, sectionsExtracted, isInitialized]);

  const setExamData = useCallback((dataUpdater: (prev: ExamData) => ExamData) => {
    setExamDataState(prev => {
      const newState = dataUpdater(prev);
      return newState;
    });
  }, []);

  const setPdfTextContent = (text: string) => {
    setExamData(prev => ({ 
      ...initialExamData, 
      pdfTextContent: text,
    }));
    setSectionsExtracted([]);
    setSectionBeingExtracted(null);
  };

  const setExamInfo = (info: ExtractExamInfoOutput) => {
    setExamData(prev => ({ 
      ...prev, 
      examInfo: info, 
      currentSection: info.sections.length > 0 ? info.sections[0] : null,
      questions: [], 
      userAnswers: [],
      currentQuestionIndex: 0,
    }));
    setSectionsExtracted([]);
  };

  const extractQuestionsForSection = useCallback(async (sectionName: string): Promise<boolean> => {
    if (!examData.pdfTextContent || !examData.examInfo || !examData.examInfo.sections.includes(sectionName)) {
      toast({ title: "Error", description: "Cannot extract questions: Missing PDF data or invalid section.", variant: "destructive" });
      return false;
    }
    if (sectionsExtracted.includes(sectionName) || sectionBeingExtracted === sectionName) {
      return true; 
    }

    setSectionBeingExtracted(sectionName);
    toast({ title: "Loading Section", description: `Extracting questions for ${sectionName}...`});

    try {
      const result = await extractQuestionsAction({
        pdfTextContent: examData.pdfTextContent,
        allSectionNames: examData.examInfo.sections,
        targetSectionName: sectionName,
      });

      if ('error' in result) {
        toast({ title: `Error: ${sectionName}`, description: result.error, variant: "destructive" });
        setSectionBeingExtracted(null);
        return false;
      }

      const newQuestions: Question[] = result.questions.map((q: ExtractedQuestionInfo, index: number) => {
        const originalOptions = [...q.options];
        const shuffledOptions = shuffleArray(originalOptions);
        return {
          id: `q-${sectionName}-${Date.now()}-${index}`,
          questionText: q.questionText,
          options: shuffledOptions, // Store pre-shuffled options
          correctAnswer: q.correctAnswerText, // Correct answer text remains the same
          section: q.section,
          originalPdfQuestionNumber: q.originalQuestionNumber,
        };
      });

      setExamData(prev => {
        const otherSectionQuestions = prev.questions.filter(q => q.section !== sectionName);
        const updatedQuestions = [...otherSectionQuestions, ...newQuestions];
        
        updatedQuestions.sort((a, b) => {
            const sectionIndexA = prev.examInfo?.sections.indexOf(a.section) ?? -1;
            const sectionIndexB = prev.examInfo?.sections.indexOf(b.section) ?? -1;
            if (sectionIndexA !== sectionIndexB) return sectionIndexA - sectionIndexB;
            // Add more sorting logic if needed (e.g., by originalPdfQuestionNumber)
            const numA = parseInt(a.originalPdfQuestionNumber?.match(/\d+$/)?.[0] || '0');
            const numB = parseInt(b.originalPdfQuestionNumber?.match(/\d+$/)?.[0] || '0');
            if (numA && numB && numA !== numB) return numA - numB;
            return 0; 
        });
        
        const newAnswers = newQuestions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 }));
        const existingAnswers = prev.userAnswers.filter(ans => !newQuestions.find(q => q.id === ans.questionId));

        return {
          ...prev,
          questions: updatedQuestions,
          userAnswers: [...existingAnswers, ...newAnswers],
        };
      });
      setSectionsExtracted(prev => [...prev, sectionName]);
      toast({ title: "Section Loaded", description: `${sectionName} questions are ready.` });
      return true;
    } catch (error: any) {
      toast({ title: `Error: ${sectionName}`, description: error.message || "Failed to extract questions.", variant: "destructive" });
      return false;
    } finally {
      setSectionBeingExtracted(null);
    }
  }, [examData.pdfTextContent, examData.examInfo, sectionsExtracted, sectionBeingExtracted, toast, setExamData]);


  const startExam = () => {
    setExamData(prev => {
      if (!prev.questions.length) {
        toast({ title: "Cannot Start", description: "No questions loaded yet. Please wait or check sections.", variant: "destructive" });
        return prev;
      }
      const firstQuestion = prev.questions[0];
      return {
        ...prev,
        startTime: Date.now(),
        endTime: null,
        isPaused: false,
        currentQuestionIndex: 0,
        currentSection: firstQuestion?.section || prev.currentSection || null,
        userAnswers: prev.questions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 })),
      };
    });
  };

  const answerQuestion = (questionId: string, selectedOption: string | null) => {
    setExamData(prev => {
      if (prev.isPaused || prev.endTime) return prev;
      const question = prev.questions.find(q => q.id === questionId);
      if (!question) return prev;
      const isCorrect = selectedOption === question.correctAnswer;
      return {
        ...prev,
        userAnswers: prev.userAnswers.map(ans =>
          ans.questionId === questionId ? { ...ans, selectedOption, isCorrect: selectedOption === null ? null : isCorrect } : ans
        ),
      };
    });
  };

  const navigateToQuestion = (questionIndex: number) => {
    setExamData(prev => {
      if (prev.isPaused || prev.endTime) return prev;
      if (questionIndex >= 0 && questionIndex < prev.questions.length) {
        return { ...prev, currentQuestionIndex: questionIndex, currentSection: prev.questions[questionIndex].section };
      }
      return prev;
    });
  };

  const navigateToSection = async (sectionName: string): Promise<void> => {
    if (!examData.examInfo || !examData.examInfo.sections.includes(sectionName)) return;

    let success = sectionsExtracted.includes(sectionName);
    if (!success && sectionBeingExtracted !== sectionName) {
        success = await extractQuestionsForSection(sectionName);
    } else if (sectionBeingExtracted === sectionName) {
        toast({ title: "Loading...", description: `Still extracting questions for ${sectionName}. Please wait.`});
        return;
    }

    if (success) {
        setExamData(prev => {
            if (prev.isPaused || prev.endTime) return prev;
            const firstQuestionInSectionIndex = prev.questions.findIndex(q => q.section === sectionName);
            if (firstQuestionInSectionIndex !== -1) {
            return { ...prev, currentQuestionIndex: firstQuestionInSectionIndex, currentSection: sectionName };
            }
            toast({title: "Empty Section", description: `No questions found for ${sectionName}.`, variant: "default"});
            return { ...prev, currentSection: sectionName }; // Navigate to section even if empty, UI will handle display
        });
    } else {
        toast({title: "Navigation Failed", description: `Could not load questions for ${sectionName}.`, variant: "destructive"});
    }
  };

  const pauseExam = () => {
    setExamData(prev => {
      if (prev.endTime || !prev.startTime) return prev; 

      const cqIndex = prev.currentQuestionIndex;
      if (cqIndex < 0 || cqIndex >= prev.questions.length) { // Check bounds
        return { ...prev, isPaused: true }; // Current index is invalid, just pause
      }
      const questionToMove = prev.questions[cqIndex];
      
      if (!questionToMove) return { ...prev, isPaused: true };

      const userAnswer = prev.userAnswers.find(ua => ua.questionId === questionToMove.id);
      let newQuestionsArray = [...prev.questions]; 
      let finalCurrentQuestionIndex = cqIndex;

      if (!userAnswer || userAnswer.selectedOption === null) { 
        newQuestionsArray.splice(cqIndex, 1); // Remove from current position

        let insertionPoint = -1;
        // Find the end of the current question's section
        for (let i = newQuestionsArray.length - 1; i >= 0; i--) {
          if (newQuestionsArray[i].section === questionToMove.section) {
            insertionPoint = i + 1; // Insert after the last question of this section
            break;
          }
        }
        // If section not found (shouldn't happen if questionToMove exists) or it was the only one,
        // or if trying to insert at the very end of the array if it was the last section
        if (insertionPoint === -1 || insertionPoint > newQuestionsArray.length) {
            newQuestionsArray.push(questionToMove); // Add to the very end of all questions
        } else {
          newQuestionsArray.splice(insertionPoint, 0, questionToMove);
        }
        
        // Adjust currentQuestionIndex if it's now out of bounds or pointing to the moved question
        if (cqIndex >= newQuestionsArray.length && newQuestionsArray.length > 0) {
          finalCurrentQuestionIndex = newQuestionsArray.length - 1;
        } else if (newQuestionsArray.length === 0) {
          finalCurrentQuestionIndex = 0; 
        } else if (finalCurrentQuestionIndex >= cqIndex && cqIndex > 0 && newQuestionsArray[cqIndex-1].section !== questionToMove.section){
          // If the question before the removed one is from a different section,
          // it means we removed the first question of a section. Stay at the "new" first question of that section if possible
          // or the previous question if it was the only one in its section.
          // This logic can be complex, simplest is to ensure index is valid or go to prev/next valid.
          // For now, if cqIndex is still valid or became the new last, it's fine. If it pointed beyond, adjust.
          // The main goal is to not be on the "moved" question. So if cqIndex still points to where `questionToMove` *was*, 
          // that element is now the *next* question. This is typically okay.
        }
      }

      const newCurrentSection = newQuestionsArray.length > 0 && newQuestionsArray[finalCurrentQuestionIndex]
        ? newQuestionsArray[finalCurrentQuestionIndex].section
        : prev.currentSection;

      return {
        ...prev,
        questions: newQuestionsArray,
        currentQuestionIndex: finalCurrentQuestionIndex,
        currentSection: newCurrentSection,
        isPaused: true,
      };
    });
  };

  const resumeExam = () => {
    setExamData(prev => {
      if (prev.endTime || !prev.startTime) return prev;
      return { ...prev, isPaused: false };
    });
  };

  const submitExam = () => {
    setExamData(prev => ({ ...prev, endTime: Date.now(), isPaused: false }));
  };

  const resetExam = () => {
    localStorage.removeItem('examData');
    localStorage.removeItem('sectionsExtracted');
    setExamDataState(initialExamData);
    setSectionsExtracted([]);
    setSectionBeingExtracted(null);
  };

  const totalQuestionsAcrossAllSections = examData.examInfo?.numberOfQuestions || 
                                           (examData.examInfo?.sections?.length || 0) * (examData.questions.length / (sectionsExtracted.length || 1) || 10);

  if (!isInitialized) {
    return null;
  }

  return (
    <ExamContext.Provider value={{
      examData,
      setPdfTextContent,
      setExamInfo,
      startExam,
      answerQuestion,
      navigateToQuestion,
      navigateToSection,
      submitExam,
      resetExam,
      pauseExam,
      resumeExam,
      isLoading,
      setIsLoading,
      sectionBeingExtracted,
      sectionsExtracted,
      extractQuestionsForSection,
      totalQuestionsAcrossAllSections
    }}>
      {children}
    </ExamContext.Provider>
  );
};

