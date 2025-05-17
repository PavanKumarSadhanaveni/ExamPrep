
"use server";

import { extractExamInfo as genAIExtractExamInfo } from '@/ai/flows/extract-exam-info';
import type { ExtractExamInfoOutput } from '@/ai/flows/extract-exam-info';
import { extractQuestions as genAIExtractQuestions } from '@/ai/flows/extract-questions-flow';
import type { ExtractQuestionsInput, ExtractQuestionsOutput } from '@/ai/flows/extract-questions-flow';
import { generateHint as genAIGenerateHint } from '@/ai/flows/generate-hint-flow';
import type { GenerateHintInput, GenerateHintOutput } from '@/ai/flows/generate-hint-flow';

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

export async function generateHintAction(input: GenerateHintInput): Promise<GenerateHintOutput | { error: string }> {
  if (!input.questionText || input.questionText.trim().length === 0) {
    return { error: "Question text must be provided for hint generation." };
  }
  if (!input.options || input.options.length < 2) {
    return { error: "At least two options must be provided for hint generation." };
  }
  if (input.hintLevel < 1 || input.hintLevel > 3) {
    return { error: "Hint level must be between 1 and 3." };
  }
  // input.examContextText is optional, so no specific validation here unless required by the flow

  try {
    const hintOutput = await genAIGenerateHint(input);
    return hintOutput;
  } catch (error) {
    console.error("Error in generateHintAction:", error);
    if (error instanceof Error) {
        return { error: `Failed to generate hint: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating a hint." };
  }
}
