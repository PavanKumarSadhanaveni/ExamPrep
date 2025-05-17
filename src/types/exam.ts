
import type { ExtractExamInfoOutput } from '@/ai/flows/extract-exam-info';

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string; // Store the correct option text
  section: string;
  originalPdfQuestionNumber?: string; // Optional: original number from PDF
}

export interface UserAnswer {
  questionId: string;
  selectedOption: string | null; // null if skipped
  isCorrect: boolean | null; // null if skipped
  timeTaken: number; // in seconds, for future use
  hintsTaken: Array<{ level: number, timestamp: number }>; // Store level and timestamp of each hint
}

export interface ExamData {
  pdfTextContent: string | null;
  examInfo: ExtractExamInfoOutput | null;
  questions: Question[];
  currentSection: string | null;
  currentQuestionIndex: number; // Overall index across all questions
  userAnswers: UserAnswer[];
  startTime: number | null; // Timestamp
  endTime: number | null; // Timestamp
  isPaused: boolean; // Indicates if the exam is currently paused
}

export interface SectionSummary {
  name: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  score: number; // Percentage score for the section
  rawScore: number; // Raw score (e.g. marks obtained)
  maxScore: number; // Max possible score for the section
}

export interface OverallResults {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  finalScore: number; // Overall percentage
  totalTimeTaken: number; // in seconds
  sectionSummaries: SectionSummary[];
  overallRawScore: number;
  overallMaxScore: number;
}

// Type for AI output when extracting questions
export interface ExtractedQuestionInfo {
  questionText: string;
  options: string[]; // Array of option texts
  correctAnswerText: string; // The text of the correct option
  section: string; // The section this question belongs to (must be one of the sections from ExamInfo)
  originalQuestionNumber?: string; // Optional: original number from PDF if AI can extract it
}
