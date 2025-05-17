
"use client";

import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import type { ExamData, Question, UserAnswer, ExtractExamInfoOutput, ExtractedQuestionInfo } from '@/types/exam';
import { extractQuestionsAction, generateHintAction } from '@/actions/examActions'; // Import the action
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
  // For HintBot
  activeQuestionHints: string[];
  hintRequestLoading: boolean;
  requestHint: (questionId: string, questionText: string, options: string[]) => Promise<boolean>;
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
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sectionBeingExtracted, setSectionBeingExtracted] = useState<string | null>(null);
  const [sectionsExtracted, setSectionsExtracted] = useState<string[]>([]);
  const [activeQuestionHints, setActiveQuestionHints] = useState<string[]>([]);
  const [hintRequestLoading, setHintRequestLoading] = useState(false);
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
                isPaused: false, // Always reset pause state on load
                currentQuestionIndex: (parsedData.startTime && !parsedData.endTime) ? parsedData.currentQuestionIndex : 0,
                currentSection: (parsedData.startTime && !parsedData.endTime && parsedData.examInfo?.sections?.includes(parsedData.currentSection || ""))
                                ? parsedData.currentSection
                                : parsedData.examInfo?.sections?.[0] || null,
                // Reset hints from localStorage as they are transient per question
                userAnswers: parsedData.userAnswers.map(ua => ({...ua, hintsUsed: ua.hintsUsed || 0})),
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
      ...initialExamData, // Reset most of the state when a new PDF is processed
      pdfTextContent: text,
    }));
    setSectionsExtracted([]);
    setSectionBeingExtracted(null);
    setActiveQuestionHints([]);
  }, [setExamData]);

  const setExamInfo = useCallback((info: ExtractExamInfoOutput) => {
    setExamData(prev => ({
      ...prev,
      examInfo: info,
      currentSection: info.sections && info.sections.length > 0 ? info.sections[0] : null,
      questions: [], // Reset questions
      userAnswers: [], // Reset answers
      currentQuestionIndex: 0,
    }));
    setSectionsExtracted([]); // Reset extracted sections as well
    setActiveQuestionHints([]);
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
        return true; // Already in progress
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
        setSectionBeingExtracted(null); // Clear loading state for this section
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

        // Sort questions based on the order of sections in examInfo, then by original question number
        updatedQuestions.sort((a, b) => {
            const sectionIndexA = prev.examInfo?.sections.indexOf(a.section) ?? -1;
            const sectionIndexB = prev.examInfo?.sections.indexOf(b.section) ?? -1;
            if (sectionIndexA !== sectionIndexB) return sectionIndexA - sectionIndexB;
            
            // Attempt to parse original question number for numerical sort if possible
            const numA = parseInt(a.originalPdfQuestionNumber?.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.originalPdfQuestionNumber?.match(/\d+/)?.[0] || '0');
            if (numA && numB && numA !== numB) return numA - numB;
            // Fallback to string compare if numbers are not distinct or not parsable
            return (a.originalPdfQuestionNumber || '').localeCompare(b.originalPdfQuestionNumber || '');
        });

        const newAnswers = newQuestions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0, hintsUsed: 0 }));
        const existingAnswers = prev.userAnswers.filter(ans => !newQuestions.find(q => q.id === ans.questionId)); // Keep answers from other sections

        let newCurrentQuestionIndex = prev.currentQuestionIndex;
        // If currentSection is the one just loaded, set index to the first question of this section
        if (prev.currentSection === sectionIdentifier && newQuestions.length > 0) {
            const firstIndexOfNewSection = updatedQuestions.findIndex(q => q.section === sectionIdentifier);
            if (firstIndexOfNewSection !== -1) {
                newCurrentQuestionIndex = firstIndexOfNewSection;
            }
        } else if (prev.questions.length === 0 && newQuestions.length > 0) { // If this is the very first set of questions loaded
            newCurrentQuestionIndex = 0;
        }


        return {
          ...prev,
          questions: updatedQuestions,
          userAnswers: [...existingAnswers, ...newAnswers],
          currentQuestionIndex: newCurrentQuestionIndex,
        };
      });
      setSectionsExtracted(prevExtracted => [...new Set([...prevExtracted, sectionIdentifier])]); // Ensure uniqueness
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

      const firstQuestionOverall = prev.questions[0]; // This should be the first question of the first section after sorting
      return {
        ...prev,
        startTime: Date.now(),
        endTime: null,
        isPaused: false,
        currentQuestionIndex: 0, // Always start from the first question overall
        currentSection: firstQuestionOverall?.section || firstFlatSectionIdentifier, // Use its section
        userAnswers: prev.questions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0, hintsUsed: 0 })),
      };
    });
    setActiveQuestionHints([]);
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
        setActiveQuestionHints([]); // Clear hints for new question
        return { ...prev, currentQuestionIndex: questionIndex, currentSection: prev.questions[questionIndex].section };
      }
      return prev;
    });
  }, [setExamData]);

  const navigateToSection = useCallback(async (sectionIdentifier: string): Promise<void> => {
    if (!examData.examInfo || !Array.isArray(examData.examInfo.sections) || !examData.examInfo.sections.includes(sectionIdentifier)) {
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
              setActiveQuestionHints([]); // Clear hints for new section/question
              return { ...prev, currentQuestionIndex: firstQuestionInSectionIndex, currentSection: sectionIdentifier };
            } else {
              toast({title: "Empty Section Part", description: `No questions were found by AI for "${sectionIdentifier}".`, variant: "default"});
              setActiveQuestionHints([]);
              return { ...prev, currentSection: sectionIdentifier, currentQuestionIndex: -1 }; 
            }
        });
    } else {
        toast({title: "Navigation Failed", description: `Could not load or navigate to section part "${sectionIdentifier}".`, variant: "destructive"});
        setExamData(prev => ({ ...prev, currentSection: sectionIdentifier })); 
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

      if (!userAnswer || userAnswer.selectedOption === null) { // Only move if unattempted
        newQuestionsArray.splice(cqIndex, 1); // Remove from current position
        
        // Find the end of the current section to insert the question
        let insertionPoint = newQuestionsArray.length; // Default to end of all questions
        for (let i = newQuestionsArray.length - 1; i >= 0; i--) {
            if (newQuestionsArray[i].section === questionToMove.section) {
                insertionPoint = i + 1;
                break;
            }
        }
        // If no other questions from the same section, find end of section block
        if (insertionPoint === newQuestionsArray.length && !newQuestionsArray.some(q => q.section === questionToMove.section)) {
            let lastIndexOfSection = -1;
            const sectionOrder = prev.examInfo?.sections || [];
            const currentQuestionSectionIndex = sectionOrder.indexOf(questionToMove.section);
            
            for(let i = newQuestionsArray.length - 1; i >= 0; i--) {
                if (sectionOrder.indexOf(newQuestionsArray[i].section) <= currentQuestionSectionIndex) {
                    lastIndexOfSection = i;
                    break;
                }
            }
            insertionPoint = lastIndexOfSection + 1;
        }


        newQuestionsArray.splice(insertionPoint, 0, questionToMove); // Insert at the end of its section or end of all Qs

        // Adjust currentQuestionIndex: if we removed the current question,
        // and it was not the last one, the next question takes its index.
        // If it was the last one, index might need to go to previous or remain.
        // For simplicity, if after moving, the cqIndex is out of bounds or points to the moved question's new pos,
        // we aim to land on the question that *would have been next* or previous if available.
        if (cqIndex < newQuestionsArray.length && newQuestionsArray[cqIndex].id !== questionToMove.id) {
            finalCurrentQuestionIndex = cqIndex; // The question at original index is now different, stay there
        } else if (cqIndex > 0) {
            finalCurrentQuestionIndex = cqIndex -1; // Go to previous question
        } else if (newQuestionsArray.length > 0) {
            finalCurrentQuestionIndex = 0; // Go to first question if previous was 0
        } else {
            finalCurrentQuestionIndex = -1; // No questions left
        }

      }
      // Determine the section of the new current question
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
    setActiveQuestionHints([]);
  }, [setExamData]);

  const resetExam = useCallback(() => {
    localStorage.removeItem('examData');
    localStorage.removeItem('sectionsExtracted');
    setExamDataState(initialExamData);
    setSectionsExtracted([]);
    setSectionBeingExtracted(null);
    setActiveQuestionHints([]);
    setIsLoadingState(false);
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
  }, []);

  const requestHint = useCallback(async (questionId: string, questionText: string, options: string[]): Promise<boolean> => {
    const currentAnswer = examData.userAnswers.find(ua => ua.questionId === questionId);
    const hintsAlreadyUsed = currentAnswer?.hintsUsed || 0;

    if (hintsAlreadyUsed >= 3) {
      toast({ title: "Max Hints Reached", description: "You've used all hints for this question.", variant: "default" });
      return false;
    }
    if (!examData.examInfo || !examData.pdfTextContent) {
        toast({ title: "Cannot Get Hint", description: "Exam data or PDF content not available.", variant: "destructive"});
        return false;
    }


    setHintRequestLoading(true);
    try {
      const hintResult = await generateHintAction({
        questionText,
        options,
        hintLevel: hintsAlreadyUsed + 1,
        examContextText: examData.pdfTextContent.substring(0, 5000) // Provide some context
      });

      if (hintResult.error) {
        toast({ title: "Hint Error", description: hintResult.error, variant: "destructive" });
        return false;
      }

      setActiveQuestionHints(prev => [...prev, hintResult.hint]);
      setExamData(prev => ({
        ...prev,
        userAnswers: prev.userAnswers.map(ua => 
          ua.questionId === questionId ? { ...ua, hintsUsed: (ua.hintsUsed || 0) + 1 } : ua
        )
      }));
      return true;
    } catch (error: any) {
      toast({ title: "Hint Request Failed", description: error.message || "Could not fetch hint.", variant: "destructive" });
      return false;
    } finally {
      setHintRequestLoading(false);
    }
  }, [examData.userAnswers, examData.examInfo, examData.pdfTextContent, toast, setExamData]);


  const totalQuestionsAcrossAllSections = useMemo(() =>
    examData.examInfo?.overallNumberOfQuestions ||
    (Array.isArray(examData.examInfo?.subjects) && examData.examInfo.subjects.length > 0
      ? examData.examInfo.subjects.reduce((totalSubjQs, subj) => {
          const sectionsInSubject = Array.isArray(subj?.subjectSections) ? subj.subjectSections : [];
          return totalSubjQs + (sectionsInSubject.reduce((totalSecQs, sec) => {
            return totalSecQs + (sec?.numberOfQuestions || 0);
          }, 0));
        }, 0)
      : examData.questions.length > 0 ? examData.questions.length : 0)
  , [examData.examInfo, examData.questions.length]);


  const contextValue = useMemo(() => ({
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
    isLoading: isLoadingState,
    setIsLoading,
    sectionBeingExtracted,
    sectionsExtracted,
    extractQuestionsForSection,
    totalQuestionsAcrossAllSections,
    activeQuestionHints,
    hintRequestLoading,
    requestHint,
  }), [
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
    isLoadingState,
    setIsLoading,
    sectionBeingExtracted,
    sectionsExtracted,
    extractQuestionsForSection,
    totalQuestionsAcrossAllSections,
    activeQuestionHints,
    hintRequestLoading,
    requestHint,
  ]);

  if (!isInitialized) {
    return null;
  }

  return (
    <ExamContext.Provider value={contextValue}>
      {children}
    </ExamContext.Provider>
  );
};

