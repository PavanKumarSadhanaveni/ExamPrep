import type { ExtractExamInfoOutput } from '@/ai/flows/extract-exam-info';

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string; // Store the correct option text or index
  section: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: string | null; // null if skipped
  isCorrect: boolean | null; // null if skipped
  timeTaken: number; // in seconds, for future use
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
}

export interface SectionSummary {
  name: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  score: number;
}

export interface OverallResults {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  finalScore: number; // Percentage or marks
  totalTimeTaken: number; // in seconds
  sectionSummaries: SectionSummary[];
}
