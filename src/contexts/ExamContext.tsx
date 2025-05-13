"use client";

import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import type { ExamData, Question, UserAnswer, ExtractExamInfoOutput, ExtractedQuestionInfo } from '@/types/exam';
import { extractQuestionsAction } from '@/actions/examActions'; // Import the action
import { useToast } from '@/hooks/use-toast';


interface ExamContextType {
  examData: ExamData;
  setPdfTextContent: (text: string) => void;
  setExamInfo: (info: ExtractExamInfoOutput) => void;
  // setQuestions is now internal, triggered by extractQuestionsForSection
  startExam: () => void;
  answerQuestion: (questionId: string, selectedOption: string | null) => void;
  navigateToQuestion: (questionIndex: number) => void;
  navigateToSection: (sectionName: string) => Promise<void>; // Can now trigger loading
  submitExam: () => void;
  resetExam: () => void;
  pauseExam: () => void;
  resumeExam: () => void;
  isLoading: boolean; // General loading for initial PDF processing
  setIsLoading: (loading: boolean) => void;
  sectionBeingExtracted: string | null; // Name of section currently being extracted
  sectionsExtracted: string[]; // Names of sections whose questions are loaded
  extractQuestionsForSection: (sectionName: string) => Promise<boolean>;
  totalQuestionsAcrossAllSections: number; // For UI display before all loaded
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
  const [isLoading, setIsLoading] = useState(false); // For initial PDF parsing & exam info
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
        // Only restore if exam was active (startTime exists but not endTime)
        // Or if exam was finished (endTime exists)
        // If neither, it implies an incomplete setup, better to start fresh or from exam details.
        if (parsedData.startTime || parsedData.endTime) {
             setExamDataState({
                ...initialExamData, // Start with defaults
                ...parsedData,      // Overlay stored data
                isPaused: false, // Always resume to non-paused state on load
             });
             if (storedSectionsExtracted) {
                setSectionsExtracted(JSON.parse(storedSectionsExtracted));
             }
        } else {
            // If exam wasn't started or finished, but there's data (e.g. after PDF upload but before starting test)
            // Preserve essential parts like pdfTextContent and examInfo. Questions will be re-fetched section-wise.
            setExamDataState(prev => ({
                ...prev,
                pdfTextContent: parsedData.pdfTextContent,
                examInfo: parsedData.examInfo,
                questions: [], // Clear questions, to be lazy-loaded
                userAnswers: [],
                currentQuestionIndex: 0,
                currentSection: parsedData.examInfo?.sections?.[0] || null,
            }));
            setSectionsExtracted([]); // Reset extracted sections
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
      // Filter out sensitive or large parts if necessary for localStorage
      const dataToStore = { ...examData };
      // If exam is active, don't store full PDF text content again if it's huge and already processed.
      // However, for lazy loading, we need it.
      localStorage.setItem('examData', JSON.stringify(dataToStore));
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
    // Reset relevant parts when a new PDF is uploaded
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
      questions: [], // Clear questions, will be loaded section by section
      userAnswers: [],
      currentQuestionIndex: 0,
    }));
    setSectionsExtracted([]); // Reset for new exam info
  };

  const extractQuestionsForSection = useCallback(async (sectionName: string): Promise<boolean> => {
    if (!examData.pdfTextContent || !examData.examInfo || !examData.examInfo.sections.includes(sectionName)) {
      toast({ title: "Error", description: "Cannot extract questions: Missing PDF data or invalid section.", variant: "destructive" });
      return false;
    }
    if (sectionsExtracted.includes(sectionName) || sectionBeingExtracted === sectionName) {
      // Already extracted or currently being extracted
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

      const newQuestions: Question[] = result.questions.map((q: ExtractedQuestionInfo, index: number) => ({
        id: `q-${sectionName}-${Date.now()}-${index}`,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswerText,
        section: q.section, // Should be targetSectionName
        originalPdfQuestionNumber: q.originalQuestionNumber,
      }));

      setExamData(prev => {
        // Filter out any existing questions from this section to prevent duplication if re-extracting
        const otherSectionQuestions = prev.questions.filter(q => q.section !== sectionName);
        const updatedQuestions = [...otherSectionQuestions, ...newQuestions];
        
        // Simple sort by section order then by original number (if available) or assign internal order
        // This assumes sections are added in order. A more robust sort might be needed if sections are extracted out of order.
        updatedQuestions.sort((a, b) => {
            const sectionIndexA = prev.examInfo?.sections.indexOf(a.section) ?? -1;
            const sectionIndexB = prev.examInfo?.sections.indexOf(b.section) ?? -1;
            if (sectionIndexA !== sectionIndexB) {
                return sectionIndexA - sectionIndexB;
            }
            // Potentially add sorting within section if needed, e.g. by originalPdfQuestionNumber if parsed as number
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
        // This case should ideally be handled before calling startExam,
        // e.g. by ensuring the first section is loaded.
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
        currentSection: firstQuestion?.section || prev.currentSection || null, // Ensure currentSection is set
         // Reset userAnswers only for questions that are part of the exam now (not for all past potential questions)
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
        return; // Avoid navigation while actively extracting current target
    }

    if (success) {
        setExamData(prev => {
            if (prev.isPaused || prev.endTime) return prev;
            const firstQuestionInSectionIndex = prev.questions.findIndex(q => q.section === sectionName);
            if (firstQuestionInSectionIndex !== -1) {
            return { ...prev, currentQuestionIndex: firstQuestionInSectionIndex, currentSection: sectionName };
            }
            // If section extracted but no questions (e.g. AI found none), stay put or handle gracefully
            toast({title: "Empty Section", description: `No questions found for ${sectionName}.`, variant: "default"});
            return prev; 
        });
    } else {
        toast({title: "Navigation Failed", description: `Could not load questions for ${sectionName}.`, variant: "destructive"});
    }
  };

  const pauseExam = () => {
    setExamData(prev => {
      if (prev.endTime || !prev.startTime) return prev; 

      const cqIndex = prev.currentQuestionIndex;
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
        if (insertionPoint === -1) {
            newQuestionsArray.push(questionToMove);
        } else {
          newQuestionsArray.splice(insertionPoint, 0, questionToMove);
        }
        if (cqIndex >= newQuestionsArray.length && newQuestionsArray.length > 0) {
          finalCurrentQuestionIndex = newQuestionsArray.length - 1;
        } else if (newQuestionsArray.length === 0) {
          finalCurrentQuestionIndex = 0; 
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
                                           (examData.examInfo?.sections?.length || 0) * (examData.questions.length / sectionsExtracted.length || 10); // Rough estimate

  if (!isInitialized) {
    return null; // Or a global loading spinner
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
