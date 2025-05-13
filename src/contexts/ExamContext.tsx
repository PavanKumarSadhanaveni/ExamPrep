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
        // Ensure all fields are present, especially functions or non-serializable parts
        setExamDataState({
          ...initialExamData, // Start with defaults
          ...parsedData,     // Override with stored data
          // Reset any state that shouldn't persist across sessions or might be problematic
          startTime: parsedData.startTime && parsedData.endTime === null ? parsedData.startTime : null, // Continue timer if exam was active
          endTime: parsedData.endTime,
        });
      } catch (error) {
        console.error("Failed to parse examData from localStorage", error);
        localStorage.removeItem('examData'); // Clear corrupted data
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
    setExamData(prev => ({ ...prev, pdfTextContent: text, questions: [], userAnswers: [], examInfo: null, startTime: null, endTime: null, currentQuestionIndex: 0, currentSection: null }));
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
      if (!prev.questions.length) return prev; // Don't start if no questions
      return {
        ...prev,
        startTime: Date.now(),
        endTime: null,
        currentQuestionIndex: 0,
        currentSection: prev.questions[0]?.section || null,
        userAnswers: prev.questions.map(q => ({ questionId: q.id, selectedOption: null, isCorrect: null, timeTaken: 0 })),
      };
    });
  };

  const answerQuestion = (questionId: string, selectedOption: string | null) => {
    setExamData(prev => {
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
      if (questionIndex >= 0 && questionIndex < prev.questions.length) {
        return { ...prev, currentQuestionIndex: questionIndex, currentSection: prev.questions[questionIndex].section };
      }
      return prev;
    });
  };

  const navigateToSection = (sectionName: string) => {
    setExamData(prev => {
      const firstQuestionInSectionIndex = prev.questions.findIndex(q => q.section === sectionName);
      if (firstQuestionInSectionIndex !== -1) {
        return { ...prev, currentQuestionIndex: firstQuestionInSectionIndex, currentSection: sectionName };
      }
      return prev;
    });
  };

  const submitExam = () => {
    setExamData(prev => ({ ...prev, endTime: Date.now() }));
  };

  const resetExam = () => {
    localStorage.removeItem('examData');
    setExamDataState(initialExamData);
  };


  if (!isInitialized) {
    return null; // Or a loading spinner for the whole app
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
      isLoading,
      setIsLoading
    }}>
      {children}
    </ExamContext.Provider>
  );
};
