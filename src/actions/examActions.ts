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
  if (!input.allSectionNames || input.allSectionNames.length === 0) {
    return { error: "All section names must be provided." };
  }
  if (!input.targetSectionName || input.targetSectionName.trim().length === 0) {
    return { error: "Target section name must be provided." };
  }
  if (!input.allSectionNames.includes(input.targetSectionName)) {
    return { error: "Target section name is not in the list of all section names." };
  }

  try {
    const questionsOutput = await genAIExtractQuestions(input);
    // The AI flow now filters for the target section, so if questions are returned, they should be for that section.
    // We still check if any questions were found.
    if (!questionsOutput.questions || questionsOutput.questions.length === 0) {
      return { error: `AI could not extract any questions for the section "${input.targetSectionName}" or no questions found matching criteria.` };
    }
    return questionsOutput;
  } catch (error) {
    console.error(`Error in extractQuestionsAction for section ${input.targetSectionName}:`, error);
    if (error instanceof Error) {
        return { error: `Failed to extract questions for section "${input.targetSectionName}": ${error.message}` };
    }
    return { error: `An unknown error occurred while extracting questions for section "${input.targetSectionName}".` };
  }
}
