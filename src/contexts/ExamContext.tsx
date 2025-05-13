"use client";

import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import type { ExamData, Question, UserAnswer, ExtractExamInfoOutput } from '@/types/exam';

interface ExamContextType {
  examData: ExamData;
  setPdfTextContent: (text: string) => void;
  setExamInfo: (info: ExtractExamInfoOutput) => void;
  setQuestions: (questions: Question[]) => void;
  startExam: () => void;
  answerQuestion: (questionId: string, selectedOption: string | null) => void;
  navigateToQuestion: (questionIndex: number) => void;
  navigateToSection: (sectionName: string) => void;
  submitExam: () => void;
  resetExam: () => void;
  pauseExam: () => void;
  resumeExam: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
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

  useEffect(() => {
    const storedExamData = localStorage.getItem('examData');
    if (storedExamData) {
      try {
        const parsedData = JSON.parse(storedExamData) as ExamData;
        setExamDataState({
          ...initialExamData,
          ...parsedData,
          startTime: parsedData.startTime && parsedData.endTime === null ? parsedData.startTime : null,
          endTime: parsedData.endTime,
          isPaused: false, // Always resume to non-paused state on load
        });
      } catch (error) {
        console.error("Failed to parse examData from localStorage", error);
        localStorage.removeItem('examData');
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('examData', JSON.stringify(examData));
    }
  }, [examData, isInitialized]);

  const setExamData = useCallback((dataUpdater: (prev: ExamData) => ExamData) => {
    setExamDataState(prev => {
      const newState = dataUpdater(prev);
      return newState;
    });
  }, []);

  const setPdfTextContent = (text: string) => {
    setExamData(prev => ({ ...initialExamData, pdfTextContent: text }));
  };

  const setExamInfo = (info: ExtractExamInfoOutput) => {
    setExamData(prev => ({ ...prev, examInfo: info, currentSection: info.sections.length > 0 ? info.sections[0] : null }));
  };

  const setQuestions = (questions: Question[]) => {
    setExamData(prev => ({
      ...prev,
      questions,
      userAnswers: questions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 })),
      currentQuestionIndex: 0,
      currentSection: questions.length > 0 ? questions[0].section : null,
    }));
  };

  const startExam = () => {
    setExamData(prev => {
      if (!prev.questions.length) return prev;
      return {
        ...prev,
        startTime: Date.now(),
        endTime: null,
        isPaused: false,
        currentQuestionIndex: 0,
        currentSection: prev.questions[0]?.section || null,
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

  const navigateToSection = (sectionName: string) => {
    setExamData(prev => {
      if (prev.isPaused || prev.endTime) return prev;
      const firstQuestionInSectionIndex = prev.questions.findIndex(q => q.section === sectionName);
      if (firstQuestionInSectionIndex !== -1) {
        return { ...prev, currentQuestionIndex: firstQuestionInSectionIndex, currentSection: sectionName };
      }
      return prev;
    });
  };

  const pauseExam = () => {
    setExamData(prev => {
      if (prev.endTime || !prev.startTime) return prev; // Can't pause if not started or already submitted

      const cqIndex = prev.currentQuestionIndex;
      const questionToMove = prev.questions[cqIndex];
      
      if (!questionToMove) return { ...prev, isPaused: true };

      const userAnswer = prev.userAnswers.find(ua => ua.questionId === questionToMove.id);
      let newQuestionsArray = [...prev.questions]; // Operate on a copy
      let finalCurrentQuestionIndex = cqIndex;

      if (!userAnswer || userAnswer.selectedOption === null) { // Question is unanswered
        // Remove the question from its current position
        newQuestionsArray.splice(cqIndex, 1);

        // Find the index to insert the question (end of its section)
        let insertionPoint = -1;
        for (let i = newQuestionsArray.length - 1; i >= 0; i--) {
          if (newQuestionsArray[i].section === questionToMove.section) {
            insertionPoint = i + 1;
            break;
          }
        }
        
        if (insertionPoint === -1) { // No other questions from this section, or section itself is now empty
            // Find the original end of this section block to insert.
            // This is complex if sections are interleaved. A simpler approach:
            // append to the very end of newQuestionsArray if its section block can't be determined.
            // For now, let's append to where its section *would* end if we consider original question order.
            // Or, more robustly, just add it to the end of all questions if its section is no longer clearly defined.
            // To truly put at "end of section", means finding last question of that section in the new list.
            // If section is A, B, A and we move first A, it should go after second A.
            // The `insertionPoint` logic above handles this. If `insertionPoint` remains -1,
            // it means questionToMove was the only one of its section (or all others were before it and now gone).
            // In this case, add it to the end of the current `newQuestionsArray`.
            newQuestionsArray.push(questionToMove);
        } else {
          newQuestionsArray.splice(insertionPoint, 0, questionToMove);
        }
        
        // The currentQuestionIndex should remain the same if valid, pointing to the question that took the moved one's place.
        // If cqIndex is now out of bounds (e.g., moved question was the last one), adjust it.
        if (cqIndex >= newQuestionsArray.length && newQuestionsArray.length > 0) {
          finalCurrentQuestionIndex = newQuestionsArray.length - 1;
        } else if (newQuestionsArray.length === 0) {
          finalCurrentQuestionIndex = 0; // Should be handled by UI (no questions)
        }
        // Otherwise, cqIndex is fine, it now points to the question that was after the moved one.
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
    setExamDataState(initialExamData);
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <ExamContext.Provider value={{
      examData,
      setPdfTextContent,
      setExamInfo,
      setQuestions,
      startExam,
      answerQuestion,
      navigateToQuestion,
      navigateToSection,
      submitExam,
      resetExam,
      pauseExam,
      resumeExam,
      isLoading,
      setIsLoading
    }}>
      {children}
    </ExamContext.Provider>
  );
};
