import type { ExtractExamInfoOutput } from '@/ai/flows/extract-exam-info';
import type { Question } from '@/types/exam';

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateMockQuestions(examInfo: ExtractExamInfoOutput | null): Question[] {
  if (!examInfo) return [];

  const questions: Question[] = [];
  const sections = examInfo.sections && examInfo.sections.length > 0 ? examInfo.sections : ['General'];
  const totalQuestionsToGenerate = examInfo.numberOfQuestions || sections.length * 5; // Default to 5 questions per section if not specified

  let questionIdCounter = 1;

  sections.forEach(sectionName => {
    // Try to parse question count from breakdown, very simplified
    let numQuestionsInSection = Math.ceil(totalQuestionsToGenerate / sections.length);
    if (examInfo.questionBreakdown) {
        const sectionBreakdownMatch = examInfo.questionBreakdown.match(new RegExp(`${sectionName}:\\s*(\\d+)`, 'i'));
        if (sectionBreakdownMatch && sectionBreakdownMatch[1]) {
            numQuestionsInSection = parseInt(sectionBreakdownMatch[1], 10);
        }
    }
    
    for (let i = 0; i < numQuestionsInSection; i++) {
      const baseOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      const shuffledOptions = shuffleArray(baseOptions);
      const correctAnswer = shuffledOptions[Math.floor(Math.random() * shuffledOptions.length)];

      questions.push({
        id: `q${questionIdCounter++}`,
        section: sectionName,
        questionText: `This is mock question ${i + 1} for ${sectionName}. What is the correct choice?`,
        options: shuffledOptions,
        correctAnswer: correctAnswer,
      });
    }
  });
  
  // If no questions were generated but we have a total count, generate generic ones
  if (questions.length === 0 && totalQuestionsToGenerate > 0) {
    for (let i = 0; i < totalQuestionsToGenerate; i++) {
      const baseOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      const shuffledOptions = shuffleArray(baseOptions);
      const correctAnswer = shuffledOptions[Math.floor(Math.random() * shuffledOptions.length)];
      questions.push({
        id: `q${questionIdCounter++}`,
        section: 'General',
        questionText: `This is mock question ${i + 1}. What is the correct choice?`,
        options: shuffledOptions,
        correctAnswer: correctAnswer,
      });
    }
  }


  // Ensure at least some questions if everything else fails
  if (questions.length === 0) {
    for (let i = 0; i < 5; i++) {
      const baseOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      const shuffledOptions = shuffleArray(baseOptions);
      const correctAnswer = shuffledOptions[Math.floor(Math.random() * shuffledOptions.length)];
      questions.push({
        id: `q_fallback_${i + 1}`,
        section: 'General',
        questionText: `Fallback mock question ${i + 1}. Select an option.`,
        options: shuffledOptions,
        correctAnswer: correctAnswer,
      });
    }
  }


  return questions;
}
