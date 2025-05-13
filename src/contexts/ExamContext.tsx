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
  const [isLoading, setIsLoading] = useState(false); // General loading, e.g. for initial PDF processing
  const [isInitialized, setIsInitialized] = useState(false);
  const [sectionBeingExtracted, setSectionBeingExtracted] = useState<string | null>(null); // Specific section loading
  const [sectionsExtracted, setSectionsExtracted] = useState<string[]>([]); // Tracks successfully extracted sections
  const { toast } = useToast();

  useEffect(() => {
    const storedExamData = localStorage.getItem('examData');
    const storedSectionsExtracted = localStorage.getItem('sectionsExtracted');
    if (storedExamData) {
      try {
        const parsedData = JSON.parse(storedExamData) as ExamData;
        if (parsedData.pdfTextContent) { // Ensure core data exists
             setExamDataState({
                ...initialExamData, 
                ...parsedData,      
                isPaused: false,    // Always start unpaused
                // If exam was in progress (startTime exists, endTime doesn't), keep currentQuestionIndex and currentSection
                // Otherwise, reset to first section/question.
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

  const setPdfTextContent = (text: string) => {
    // Reset everything when a new PDF is uploaded
    setExamData(prev => ({ 
      ...initialExamData, // Start with a clean slate
      pdfTextContent: text, // Set the new PDF text
    }));
    setSectionsExtracted([]); // Reset which sections have been extracted
    setSectionBeingExtracted(null); // No section is currently being extracted
  };

  const setExamInfo = (info: ExtractExamInfoOutput) => {
    setExamData(prev => ({ 
      ...prev, 
      examInfo: info, 
      // Set currentSection to the first section if available, otherwise null
      currentSection: info.sections && info.sections.length > 0 ? info.sections[0] : null,
      // Reset questions and userAnswers as they depend on the new examInfo
      questions: [], 
      userAnswers: [],
      currentQuestionIndex: 0, // Reset to the first question index
    }));
    setSectionsExtracted([]); // Reset extracted sections status
  };

  const extractQuestionsForSection = useCallback(async (sectionName: string): Promise<boolean> => {
    if (!examData.pdfTextContent || !examData.examInfo || !examData.examInfo.sections.includes(sectionName)) {
      toast({ title: "Error", description: "Cannot extract questions: Missing PDF data or invalid section.", variant: "destructive" });
      return false;
    }
    // Avoid re-extraction if already extracted or currently being extracted
    if (sectionsExtracted.includes(sectionName)) {
      console.log(`Section ${sectionName} already extracted.`);
      return true; 
    }
    if (sectionBeingExtracted === sectionName) {
        console.log(`Section ${sectionName} is currently being extracted.`);
        return true; // Indicate that the process is ongoing or will complete
    }

    setSectionBeingExtracted(sectionName);
    toast({ title: "Loading Section", description: `Extracting questions for ${sectionName}... This might take a moment.`});

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
        const shuffledOptions = shuffleArray(originalOptions); // Shuffle options once
        return {
          id: `q-${sectionName.replace(/\s+/g, '-')}-${Date.now()}-${index}`, // More unique ID
          questionText: q.questionText,
          options: shuffledOptions, 
          correctAnswer: q.correctAnswerText, 
          section: q.section,
          originalPdfQuestionNumber: q.originalQuestionNumber,
        };
      });

      setExamData(prev => {
        // Filter out any existing questions from this section to avoid duplicates if re-extraction occurs (though ideally prevented)
        const otherSectionQuestions = prev.questions.filter(q => q.section !== sectionName);
        let updatedQuestions = [...otherSectionQuestions, ...newQuestions];
        
        // Sort all questions based on section order then original PDF number
        updatedQuestions.sort((a, b) => {
            const sectionIndexA = prev.examInfo?.sections.indexOf(a.section) ?? -1;
            const sectionIndexB = prev.examInfo?.sections.indexOf(b.section) ?? -1;
            if (sectionIndexA !== sectionIndexB) return sectionIndexA - sectionIndexB;
            
            // Attempt to parse numeric part of originalPdfQuestionNumber for sorting
            const numA = parseInt(a.originalPdfQuestionNumber?.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.originalPdfQuestionNumber?.match(/\d+/)?.[0] || '0');

            if (numA && numB && numA !== numB) return numA - numB;
            // Fallback for non-numeric or missing numbers to maintain some order
            return (a.originalPdfQuestionNumber || '').localeCompare(b.originalPdfQuestionNumber || '');
        });
        
        // Create UserAnswer stubs for new questions
        const newAnswers = newQuestions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 }));
        const existingAnswers = prev.userAnswers.filter(ans => !newQuestions.find(q => q.id === ans.questionId));

        let newCurrentQuestionIndex = prev.currentQuestionIndex;
        // If the current viewed section is the one just loaded, set index to its first question
        // This helps if user manually navigated to a section that was loading
        if (prev.currentSection === sectionName && newQuestions.length > 0) {
            const firstIndexOfNewSection = updatedQuestions.findIndex(q => q.section === sectionName);
            if (firstIndexOfNewSection !== -1) {
                newCurrentQuestionIndex = firstIndexOfNewSection;
            }
        } else if (prev.questions.length === 0 && newQuestions.length > 0) { // If this is the first set of questions loaded overall
            newCurrentQuestionIndex = 0;
        }


        return {
          ...prev,
          questions: updatedQuestions,
          userAnswers: [...existingAnswers, ...newAnswers],
          currentQuestionIndex: newCurrentQuestionIndex,
        };
      });
      setSectionsExtracted(prevExtracted => [...new Set([...prevExtracted, sectionName])]); // Ensure unique
      toast({ title: "Section Loaded", description: `${sectionName} questions are ready.` });
      return true;
    } catch (error: any) {
      toast({ title: `Error: ${sectionName}`, description: error.message || "Failed to extract questions for this section.", variant: "destructive" });
      return false;
    } finally {
      setSectionBeingExtracted(null);
    }
  }, [examData.pdfTextContent, examData.examInfo, sectionsExtracted, sectionBeingExtracted, toast, setExamData]);


  const startExam = () => {
    setExamData(prev => {
      if (!prev.examInfo || prev.examInfo.sections.length === 0) {
         toast({ title: "Cannot Start", description: "No sections defined in exam info.", variant: "destructive" });
        return prev;
      }
      const firstSectionName = prev.examInfo.sections[0];
      if (!sectionsExtracted.includes(firstSectionName) || prev.questions.filter(q => q.section === firstSectionName).length === 0) {
        toast({ title: "Cannot Start", description: `Questions for the first section (${firstSectionName}) are not loaded or none found. Please wait or check exam details.`, variant: "destructive" });
        return prev;
      }
      if (!prev.questions.length) { // General check if any questions loaded at all
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
        currentSection: firstQuestionOverall?.section || firstSectionName, // Fallback to first section name
        // Initialize userAnswers for ALL currently loaded questions
        userAnswers: prev.questions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 })),
      };
    });
  };

  const answerQuestion = (questionId: string, selectedOption: string | null) => {
    setExamData(prev => {
      if (prev.isPaused || prev.endTime) return prev; // Prevent answering if paused or exam ended
      const question = prev.questions.find(q => q.id === questionId);
      if (!question) return prev; // Question not found
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
    if (!examData.examInfo || !examData.examInfo.sections.includes(sectionName)) {
        toast({ title: "Invalid Section", description: `Section "${sectionName}" does not exist in this exam.`, variant: "destructive" });
        return;
    }

    let questionsForSectionExist = sectionsExtracted.includes(sectionName);
    if (!questionsForSectionExist && sectionBeingExtracted !== sectionName) {
        // Attempt to load if not loaded and not currently loading
        questionsForSectionExist = await extractQuestionsForSection(sectionName);
    } else if (sectionBeingExtracted === sectionName) {
        toast({ title: "Loading in Progress", description: `Still extracting questions for ${sectionName}. Please wait.`});
        return; // Avoid changing section while it's actively loading initiated by another process
    }

    // After attempting to load (or if already loaded)
    if (questionsForSectionExist) {
        setExamData(prev => {
            if (prev.isPaused || prev.endTime) return prev;
            const firstQuestionInSectionIndex = prev.questions.findIndex(q => q.section === sectionName);
            
            if (firstQuestionInSectionIndex !== -1) {
              // Section has questions, navigate to the first one
              return { ...prev, currentQuestionIndex: firstQuestionInSectionIndex, currentSection: sectionName };
            } else {
              // Section is loaded (marked as extracted) but no questions were found for it by AI
              toast({title: "Empty Section", description: `No questions were found by the AI for section "${sectionName}". You can try loading other sections.`, variant: "default"});
              // Still update currentSection to reflect user's intent, but no question to show
              return { ...prev, currentSection: sectionName, currentQuestionIndex: -1 }; // Use -1 to indicate no valid question in section
            }
        });
    } else {
        // extractQuestionsForSection returned false (likely an error occurred and was toasted)
        toast({title: "Navigation Failed", description: `Could not load or navigate to section "${sectionName}".`, variant: "destructive"});
        // Optionally, you might want to revert currentSection or keep it as is, depending on desired UX
        setExamData(prev => ({ ...prev, currentSection: sectionName })); // Update to show user tried to navigate here
    }
  };

  const pauseExam = () => {
    setExamData(prev => {
      if (prev.endTime || !prev.startTime || prev.isPaused) return prev; 

      const cqIndex = prev.currentQuestionIndex;
      // Ensure cqIndex is valid before trying to access questions[cqIndex]
      if (cqIndex < 0 || cqIndex >= prev.questions.length) { 
        // No valid current question to move, just pause
        return { ...prev, isPaused: true }; 
      }
      
      const questionToMove = prev.questions[cqIndex];
      if (!questionToMove) return { ...prev, isPaused: true }; // Should not happen if cqIndex is valid

      const userAnswer = prev.userAnswers.find(ua => ua.questionId === questionToMove.id);
      let newQuestionsArray = [...prev.questions]; 
      let finalCurrentQuestionIndex = cqIndex;

      // Only move the question if it's unattempted (selectedOption is null)
      if (!userAnswer || userAnswer.selectedOption === null) { 
        // Remove the current question from its position
        newQuestionsArray.splice(cqIndex, 1); 

        // Find the end of the current question's section to re-insert it
        let insertionPoint = -1;
        for (let i = newQuestionsArray.length - 1; i >= 0; i--) {
          if (newQuestionsArray[i].section === questionToMove.section) {
            insertionPoint = i + 1; // Insert after the last question of this section
            break;
          }
        }
        // If section was not found (e.g., it was the only question in its section and now array is empty for it)
        // or if insertionPoint is beyond array length, push to end.
        // Otherwise, splice it in.
        if (insertionPoint === -1 || insertionPoint > newQuestionsArray.length) {
            // This case implies the section is now empty or it's the very end of all questions.
            // We should add it to the general end of the newQuestionsArray if no section mates are found.
            // A safer bet is to push to the end of newQuestionsArray if its original section is no longer "meaningful" for placement.
            // However, the original logic seems to aim to keep it within its section.
            // If insertionPoint is -1, it means the section is now empty of other questions. Push it to the end of the overall list.
            newQuestionsArray.push(questionToMove);
        } else {
          newQuestionsArray.splice(insertionPoint, 0, questionToMove);
        }
        
        // Adjust currentQuestionIndex if needed:
        // If the original cqIndex is now out of bounds (e.g., it was the last item),
        // or if the list is empty.
        if (cqIndex >= newQuestionsArray.length && newQuestionsArray.length > 0) {
          finalCurrentQuestionIndex = newQuestionsArray.length - 1; // Point to new last question
        } else if (newQuestionsArray.length === 0) {
          finalCurrentQuestionIndex = 0; // Or -1 if preferred for "no questions"
        }
        // If cqIndex is still valid, it effectively points to the *next* question
        // (or the one that took the place of the moved question).
      }

      // Determine the new currentSection based on the adjusted finalCurrentQuestionIndex
      const newCurrentSection = (newQuestionsArray.length > 0 && finalCurrentQuestionIndex >=0 && finalCurrentQuestionIndex < newQuestionsArray.length && newQuestionsArray[finalCurrentQuestionIndex])
        ? newQuestionsArray[finalCurrentQuestionIndex].section
        : prev.currentSection; // Fallback to previous section if index is invalid or array empty

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
      if (prev.endTime || !prev.startTime) return prev; // Cannot resume if not started or already ended
      return { ...prev, isPaused: false };
    });
  };

  const submitExam = () => {
    setExamData(prev => ({ ...prev, endTime: Date.now(), isPaused: false })); // Ensure isPaused is false on submit
  };

  const resetExam = () => {
    localStorage.removeItem('examData');
    localStorage.removeItem('sectionsExtracted');
    setExamDataState(initialExamData);
    setSectionsExtracted([]);
    setSectionBeingExtracted(null);
    setIsLoading(false); // Reset general loading state too
  };

  const totalQuestionsAcrossAllSections = 
    examData.examInfo?.numberOfQuestions || 
    (examData.examInfo?.sections?.length 
      ? examData.examInfo.sections.reduce((acc, sectionName) => {
          const sectionQuestionsCount = examData.questions.filter(q => q.section === sectionName).length;
          // If section is extracted and has questions, use that count.
          // If section is extracted but has 0 questions, count 0.
          // If section is NOT extracted, assume a placeholder (e.g., 10, or average) for progress estimate.
          if (sectionsExtracted.includes(sectionName)) {
            return acc + sectionQuestionsCount;
          }
          return acc + 10; // Estimate for unloaded sections for progress bar
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
