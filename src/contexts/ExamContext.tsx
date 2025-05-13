

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
        // Check if crucial data like pdfTextContent exists before fully restoring
        if (parsedData.pdfTextContent) {
             setExamDataState({
                ...initialExamData, // Start with defaults
                ...parsedData,      // Overlay stored data
                isPaused: false,    // Always start unpaused
                // Ensure currentSection is valid if sections exist
                currentSection: parsedData.examInfo?.sections?.includes(parsedData.currentSection || "") 
                                ? parsedData.currentSection 
                                : parsedData.examInfo?.sections?.[0] || null,
             });
             if (storedSectionsExtracted) {
                setSectionsExtracted(JSON.parse(storedSectionsExtracted));
             }
        } else {
            // If essential data is missing, clear and start fresh
            localStorage.removeItem('examData');
            localStorage.removeItem('sectionsExtracted');
            setExamDataState(initialExamData);
            setSectionsExtracted([]);
        }
      } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.removeItem('examData');
        localStorage.removeItem('sectionsExtracted');
        setExamDataState(initialExamData); // Reset to initial state on error
        setSectionsExtracted([]);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && examData.pdfTextContent) { // Only save if there's actual content to save
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
    setSectionsExtracted([]); // Reset extracted sections when new info is set
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
          id: `q-${sectionName.replace(/\s+/g, '-')}-${Date.now()}-${index}`,
          questionText: q.questionText,
          options: shuffledOptions, 
          correctAnswer: q.correctAnswerText, 
          section: q.section,
          originalPdfQuestionNumber: q.originalQuestionNumber,
        };
      });

      setExamData(prev => {
        const otherSectionQuestions = prev.questions.filter(q => q.section !== sectionName);
        let updatedQuestions = [...otherSectionQuestions, ...newQuestions];
        
        updatedQuestions.sort((a, b) => {
            const sectionIndexA = prev.examInfo?.sections.indexOf(a.section) ?? -1;
            const sectionIndexB = prev.examInfo?.sections.indexOf(b.section) ?? -1;
            if (sectionIndexA !== sectionIndexB) return sectionIndexA - sectionIndexB;
            
            const numA = parseInt(a.originalPdfQuestionNumber?.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.originalPdfQuestionNumber?.match(/\d+/)?.[0] || '0');

            if (numA && numB && numA !== numB) return numA - numB;
            // Fallback for non-numeric or missing numbers
            return (a.originalPdfQuestionNumber || '').localeCompare(b.originalPdfQuestionNumber || '');
        });
        
        const newAnswers = newQuestions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 }));
        const existingAnswers = prev.userAnswers.filter(ans => !newQuestions.find(q => q.id === ans.questionId));

        let newCurrentQuestionIndex = prev.currentQuestionIndex;
        // If the current section is the one just loaded, and no questions were previously loaded for it,
        // or if the current index points to a placeholder for this section.
        if (prev.currentSection === sectionName && newQuestions.length > 0) {
            const firstIndexOfNewSection = updatedQuestions.findIndex(q => q.section === sectionName);
            if (firstIndexOfNewSection !== -1) {
                newCurrentQuestionIndex = firstIndexOfNewSection;
            }
        }


        return {
          ...prev,
          questions: updatedQuestions,
          userAnswers: [...existingAnswers, ...newAnswers],
          currentQuestionIndex: newCurrentQuestionIndex,
        };
      });
      setSectionsExtracted(prevExtracted => [...prevExtracted, sectionName]);
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
            toast({title: "Empty Section", description: `No questions found for ${sectionName}. You can try loading other sections.`, variant: "default"});
            return { ...prev, currentSection: sectionName }; 
        });
    } else {
        toast({title: "Navigation Failed", description: `Could not load questions for ${sectionName}.`, variant: "destructive"});
    }
  };

  const pauseExam = () => {
    setExamData(prev => {
      if (prev.endTime || !prev.startTime || prev.isPaused) return prev; 

      const cqIndex = prev.currentQuestionIndex;
      if (cqIndex < 0 || cqIndex >= prev.questions.length) { 
        return { ...prev, isPaused: true }; 
      }
      const questionToMove = prev.questions[cqIndex];
      
      if (!questionToMove) return { ...prev, isPaused: true };

      const userAnswer = prev.userAnswers.find(ua => ua.questionId === questionToMove.id);
      let newQuestionsArray = [...prev.questions]; 
      let finalCurrentQuestionIndex = cqIndex;

      if (!userAnswer || userAnswer.selectedOption === null) { 
        newQuestionsArray.splice(cqIndex, 1); 

        let insertionPoint = -1;
        for (let i = newQuestionsArray.length - 1; i >= 0; i--) {
          if (newQuestionsArray[i].section === questionToMove.section) {
            insertionPoint = i + 1; 
            break;
          }
        }
        if (insertionPoint === -1 || insertionPoint > newQuestionsArray.length) {
            newQuestionsArray.push(questionToMove); 
        } else {
          newQuestionsArray.splice(insertionPoint, 0, questionToMove);
        }
        
        if (cqIndex >= newQuestionsArray.length && newQuestionsArray.length > 0) {
          finalCurrentQuestionIndex = newQuestionsArray.length - 1;
        } else if (newQuestionsArray.length === 0) {
          finalCurrentQuestionIndex = 0; 
        }
        // If cqIndex is still valid (it would now point to the *next* question after removal),
        // or if it was the last question and got adjusted, it should be fine.
        // The main thing is not to be on the "moved" question when resuming.
      }

      const newCurrentSection = newQuestionsArray.length > 0 && finalCurrentQuestionIndex < newQuestionsArray.length && newQuestionsArray[finalCurrentQuestionIndex]
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

  // Estimate total questions if not explicitly provided by AI in examInfo
  const totalQuestionsAcrossAllSections = 
    examData.examInfo?.numberOfQuestions || 
    (examData.examInfo?.sections?.length 
      ? examData.examInfo.sections.reduce((acc, sectionName) => {
          // A very rough estimate: assume each section has about 10-20 questions if not specified
          // This is primarily for progress bar visualization if numberOfQuestions is missing.
          // A better approach would be for AI to provide question count per section if possible.
          const sectionQuestions = examData.questions.filter(q => q.section === sectionName).length;
          return acc + (sectionQuestions > 0 ? sectionQuestions : (sectionsExtracted.includes(sectionName) ? 0 : 10)); // Assume 10 for unloaded sections
        }, 0)
      : examData.questions.length > 0 ? examData.questions.length : 0);


  if (!isInitialized) {
    // Render nothing or a minimal loader until context is initialized from localStorage
    // This helps prevent hydration errors if server and client initial states differ wildly.
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

