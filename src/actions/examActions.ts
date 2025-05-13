"use server";

import { extractExamInfo as genAIExtractExamInfo } from '@/ai/flows/extract-exam-info';
import type { ExtractExamInfoOutput } from '@/ai/flows/extract-exam-info';

export async function extractExamInfoAction(pdfTextContent: string): Promise<ExtractExamInfoOutput | { error: string }> {
  if (!pdfTextContent || pdfTextContent.trim().length === 0) {
    return { error: "PDF text content is empty." };
  }

  try {
    const examInfo = await genAIExtractExamInfo({ pdfTextContent });
    return examInfo;
  } catch (error) {
    console.error("Error in extractExamInfoAction:", error);
    // It's good to return a structured error that the client can understand
    if (error instanceof Error) {
        return { error: `Failed to extract exam information: ${error.message}` };
    }
    return { error: "An unknown error occurred while extracting exam information." };
  }
}
