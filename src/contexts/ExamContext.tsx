
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
  navigateToSection: (sectionName: string) => Promise<void>; // sectionName is the flat "Subject - Section" identifier
  submitExam: () => void;
  resetExam: () => void;
  pauseExam: () => void;
  resumeExam: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  sectionBeingExtracted: string | null; // flat "Subject - Section" identifier
  sectionsExtracted: string[]; // flat list of "Subject - Section" identifiers
  extractQuestionsForSection: (sectionName: string) => Promise<boolean>; // sectionName is flat "Subject - Section" identifier
  totalQuestionsAcrossAllSections: number;
}

const initialExamData: ExamData = {
  pdfTextContent: null,
  examInfo: null, // Will now hold the new structured ExtractExamInfoOutput
  questions: [],
  currentSection: null, // This will store the flat "Subject - Section" identifier of the current view
  currentQuestionIndex: 0,
  userAnswers: [],
  startTime: null,
  endTime: null,
  isPaused: false,
};

export const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [examData, setExamDataState] = useState<ExamData>(initialExamData);
  const [isLoading, setIsLoadingState] = useState(false); // Renamed to avoid conflict with context value
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
        if (parsedData.pdfTextContent && parsedData.examInfo && parsedData.examInfo.sections) {
             setExamDataState({
                ...initialExamData,
                ...parsedData,
                isPaused: false,
                currentQuestionIndex: (parsedData.startTime && !parsedData.endTime) ? parsedData.currentQuestionIndex : 0,
                currentSection: (parsedData.startTime && !parsedData.endTime && parsedData.examInfo?.sections?.includes(parsedData.currentSection || ""))
                                ? parsedData.currentSection
                                : parsedData.examInfo?.sections?.[0] || null,
             });
             if (storedSectionsExtracted) {
                setSectionsExtracted(JSON.parse(storedSectionsExtracted));
             }
        } else {
            localStorage.removeItem('examData');
            localStorage.removeItem('sectionsExtracted');
            setExamDataState(initialExamData);
            setSectionsExtracted([]);
        }
      } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.removeItem('examData');
        localStorage.removeItem('sectionsExtracted');
        setExamDataState(initialExamData);
        setSectionsExtracted([]);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && examData.pdfTextContent) {
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

  const setPdfTextContent = useCallback((text: string) => {
    setExamData(prev => ({
      ...initialExamData,
      pdfTextContent: text,
    }));
    setSectionsExtracted([]);
    setSectionBeingExtracted(null);
  }, [setExamData]);

  const setExamInfo = useCallback((info: ExtractExamInfoOutput) => {
    setExamData(prev => ({
      ...prev,
      examInfo: info,
      currentSection: info.sections && info.sections.length > 0 ? info.sections[0] : null,
      questions: [],
      userAnswers: [],
      currentQuestionIndex: 0,
    }));
    setSectionsExtracted([]);
  }, [setExamData]);

  const extractQuestionsForSection = useCallback(async (sectionIdentifier: string): Promise<boolean> => {
    if (!examData.pdfTextContent || !examData.examInfo || !examData.examInfo.sections.includes(sectionIdentifier)) {
      toast({ title: "Error", description: `Cannot extract questions: Missing PDF data or invalid section identifier "${sectionIdentifier}".`, variant: "destructive" });
      return false;
    }
    if (sectionsExtracted.includes(sectionIdentifier)) {
      return true;
    }
    if (sectionBeingExtracted === sectionIdentifier) {
        return true;
    }

    setSectionBeingExtracted(sectionIdentifier);
    toast({ title: "Loading Section Part", description: `Extracting questions for ${sectionIdentifier}...`});

    try {
      const result = await extractQuestionsAction({
        pdfTextContent: examData.pdfTextContent,
        allSectionNames: examData.examInfo.sections,
        targetSectionName: sectionIdentifier,
      });

      if ('error' in result) {
        toast({ title: `Error: ${sectionIdentifier}`, description: result.error, variant: "destructive" });
        setSectionBeingExtracted(null);
        return false;
      }

      const newQuestions: Question[] = result.questions.map((q: ExtractedQuestionInfo, index: number) => {
        const originalOptions = [...q.options];
        const shuffledOptions = shuffleArray(originalOptions);
        return {
          id: `q-${sectionIdentifier.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}-${index}`,
          questionText: q.questionText,
          options: shuffledOptions,
          correctAnswer: q.correctAnswerText,
          section: q.section,
          originalPdfQuestionNumber: q.originalQuestionNumber,
        };
      });

      setExamData(prev => {
        const otherSectionQuestions = prev.questions.filter(q => q.section !== sectionIdentifier);
        let updatedQuestions = [...otherSectionQuestions, ...newQuestions];

        updatedQuestions.sort((a, b) => {
            const sectionIndexA = prev.examInfo?.sections.indexOf(a.section) ?? -1;
            const sectionIndexB = prev.examInfo?.sections.indexOf(b.section) ?? -1;
            if (sectionIndexA !== sectionIndexB) return sectionIndexA - sectionIndexB;

            const numA = parseInt(a.originalPdfQuestionNumber?.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.originalPdfQuestionNumber?.match(/\d+/)?.[0] || '0');
            if (numA && numB && numA !== numB) return numA - numB;
            return (a.originalPdfQuestionNumber || '').localeCompare(b.originalPdfQuestionNumber || '');
        });

        const newAnswers = newQuestions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 }));
        const existingAnswers = prev.userAnswers.filter(ans => !newQuestions.find(q => q.id === ans.questionId));

        let newCurrentQuestionIndex = prev.currentQuestionIndex;
        if (prev.currentSection === sectionIdentifier && newQuestions.length > 0) {
            const firstIndexOfNewSection = updatedQuestions.findIndex(q => q.section === sectionIdentifier);
            if (firstIndexOfNewSection !== -1) {
                newCurrentQuestionIndex = firstIndexOfNewSection;
            }
        } else if (prev.questions.length === 0 && newQuestions.length > 0) {
            newCurrentQuestionIndex = 0;
        }

        return {
          ...prev,
          questions: updatedQuestions,
          userAnswers: [...existingAnswers, ...newAnswers],
          currentQuestionIndex: newCurrentQuestionIndex,
        };
      });
      setSectionsExtracted(prevExtracted => [...new Set([...prevExtracted, sectionIdentifier])]);
      toast({ title: "Section Part Loaded", description: `${sectionIdentifier} questions are ready.` });
      return true;
    } catch (error: any) {
      toast({ title: `Error: ${sectionIdentifier}`, description: error.message || "Failed to extract questions for this section part.", variant: "destructive" });
      return false;
    } finally {
      setSectionBeingExtracted(null);
    }
  }, [examData.pdfTextContent, examData.examInfo, sectionsExtracted, sectionBeingExtracted, toast, setExamData]);


  const startExam = useCallback(() => {
    setExamData(prev => {
      if (!prev.examInfo || !prev.examInfo.sections || prev.examInfo.sections.length === 0) {
         toast({ title: "Cannot Start", description: "No sections defined in exam info.", variant: "destructive" });
        return prev;
      }
      const firstFlatSectionIdentifier = prev.examInfo.sections[0];
      if (!sectionsExtracted.includes(firstFlatSectionIdentifier) || prev.questions.filter(q => q.section === firstFlatSectionIdentifier).length === 0) {
        toast({ title: "Cannot Start", description: `Questions for the first section part (${firstFlatSectionIdentifier}) are not loaded or none found.`, variant: "destructive" });
        return prev;
      }
      if (!prev.questions.length) {
        toast({ title: "Cannot Start", description: "No questions loaded yet.", variant: "destructive" });
        return prev;
      }

      const firstQuestionOverall = prev.questions[0];
      return {
        ...prev,
        startTime: Date.now(),
        endTime: null,
        isPaused: false,
        currentQuestionIndex: 0,
        currentSection: firstQuestionOverall?.section || firstFlatSectionIdentifier,
        userAnswers: prev.questions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 })),
      };
    });
  }, [setExamData, sectionsExtracted, toast]);

  const answerQuestion = useCallback((questionId: string, selectedOption: string | null) => {
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
  }, [setExamData]);

  const navigateToQuestion = useCallback((questionIndex: number) => {
    setExamData(prev => {
      if (prev.isPaused || prev.endTime) return prev;
      if (questionIndex >= 0 && questionIndex < prev.questions.length) {
        return { ...prev, currentQuestionIndex: questionIndex, currentSection: prev.questions[questionIndex].section };
      }
      return prev;
    });
  }, [setExamData]);

  const navigateToSection = useCallback(async (sectionIdentifier: string): Promise<void> => {
    if (!examData.examInfo || !examData.examInfo.sections.includes(sectionIdentifier)) {
        toast({ title: "Invalid Section Identifier", description: `"${sectionIdentifier}" does not exist in this exam.`, variant: "destructive" });
        return;
    }

    let questionsForSectionExist = sectionsExtracted.includes(sectionIdentifier);
    if (!questionsForSectionExist && sectionBeingExtracted !== sectionIdentifier) {
        questionsForSectionExist = await extractQuestionsForSection(sectionIdentifier);
    } else if (sectionBeingExtracted === sectionIdentifier) {
        toast({ title: "Loading in Progress", description: `Still extracting questions for ${sectionIdentifier}. Please wait.`});
        return;
    }

    if (questionsForSectionExist) {
        setExamData(prev => {
            if (prev.isPaused || prev.endTime) return prev;
            const firstQuestionInSectionIndex = prev.questions.findIndex(q => q.section === sectionIdentifier);

            if (firstQuestionInSectionIndex !== -1) {
              return { ...prev, currentQuestionIndex: firstQuestionInSectionIndex, currentSection: sectionIdentifier };
            } else {
              toast({title: "Empty Section Part", description: `No questions were found by AI for "${sectionIdentifier}".`, variant: "default"});
              return { ...prev, currentSection: sectionIdentifier, currentQuestionIndex: -1 }; // Keep currentQuestionIndex to indicate no question selected or show an empty state.
            }
        });
    } else {
        toast({title: "Navigation Failed", description: `Could not load or navigate to section part "${sectionIdentifier}".`, variant: "destructive"});
        setExamData(prev => ({ ...prev, currentSection: sectionIdentifier })); // Update current section even if loading failed, so UI reflects intent
    }
  }, [examData.examInfo, sectionsExtracted, sectionBeingExtracted, extractQuestionsForSection, toast, setExamData]);

  const pauseExam = useCallback(() => {
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
          finalCurrentQuestionIndex = 0; // Or -1 if you prefer to show no question
        }
      }
      const newCurrentSection = (newQuestionsArray.length > 0 && finalCurrentQuestionIndex >=0 && finalCurrentQuestionIndex < newQuestionsArray.length && newQuestionsArray[finalCurrentQuestionIndex])
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
  }, [setExamData]);

  const resumeExam = useCallback(() => {
    setExamData(prev => {
      if (prev.endTime || !prev.startTime) return prev;
      return { ...prev, isPaused: false };
    });
  }, [setExamData]);

  const submitExam = useCallback(() => {
    setExamData(prev => ({ ...prev, endTime: Date.now(), isPaused: false }));
  }, [setExamData]);

  const resetExam = useCallback(() => {
    localStorage.removeItem('examData');
    localStorage.removeItem('sectionsExtracted');
    setExamDataState(initialExamData);
    setSectionsExtracted([]);
    setSectionBeingExtracted(null);
    setIsLoadingState(false);
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
  }, []);


  const totalQuestionsAcrossAllSections =
    examData.examInfo?.overallNumberOfQuestions ||
    (examData.examInfo?.sections?.length && Array.isArray(examData.examInfo.subjects)
      ? examData.examInfo.subjects.reduce((totalSubjQs, subj) => {
          const sectionsInSubject = Array.isArray(subj?.subjectSections) ? subj.subjectSections : [];
          return totalSubjQs + (sectionsInSubject.reduce((totalSecQs, sec) => {
            return totalSecQs + (sec?.numberOfQuestions || 0);
          }, 0));
        }, 0)
      : examData.questions.length > 0 ? examData.questions.length : 0);


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
      isLoading: isLoading, // Use the renamed state variable
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
