"use server";

import { extractExamInfo as genAIExtractExamInfo } from '@/ai/flows/extract-exam-info';
import type { ExtractExamInfoOutput } from '@/ai/flows/extract-exam-info';
import { extractQuestions as genAIExtractQuestions } from '@/ai/flows/extract-questions-flow';
import type { ExtractQuestionsInput, ExtractQuestionsOutput } from '@/ai/flows/extract-questions-flow';

export async function extractExamInfoAction(pdfTextContent: string): Promise<ExtractExamInfoOutput | { error: string }> {
  if (!pdfTextContent || pdfTextContent.trim().length === 0) {
    return { error: "PDF text content is empty." };
  }

  try {
    const examInfo = await genAIExtractExamInfo({ pdfTextContent });
    return examInfo;
  } catch (error) {
    console.error("Error in extractExamInfoAction:", error);
    if (error instanceof Error) {
        return { error: `Failed to extract exam information: ${error.message}` };
    }
    return { error: "An unknown error occurred while extracting exam information." };
  }
}

export async function extractQuestionsAction(input: ExtractQuestionsInput): Promise<ExtractQuestionsOutput | { error: string }> {
  if (!input.pdfTextContent || input.pdfTextContent.trim().length === 0) {
    return { error: "PDF text content is empty for question extraction." };
  }
  if (!input.sections || input.sections.length === 0) {
    // If no sections identified, provide a default or handle as an error/warning.
    // For now, let's proceed with a default 'General' section if AI needs it.
    // The AI prompt for extractQuestionsFlow should be robust to this.
    console.warn("No sections provided for question extraction. AI will attempt to categorize generally.");
  }

  try {
    const questionsOutput = await genAIExtractQuestions(input);
    if (!questionsOutput.questions || questionsOutput.questions.length === 0) {
      return { error: "AI could not extract any questions or no questions found matching criteria." };
    }
    return questionsOutput;
  } catch (error) {
    console.error("Error in extractQuestionsAction:", error);
    if (error instanceof Error) {
        return { error: `Failed to extract questions: ${error.message}` };
    }
    return { error: "An unknown error occurred while extracting questions." };
  }
}
