'use server';
/**
 * @fileOverview AI flow for extracting questions from PDF text content.
 *
 * - extractQuestions - A function that handles the question extraction process.
 * - ExtractQuestionsInput - The input type for the extractQuestions function.
 * - ExtractQuestionsOutput - The return type for the extractQuestions function.
 */

import {ai} from '@/ai/genkit';
import type { ExtractedQuestionInfo } from '@/types/exam'; // Use the shared type
import {z} from 'genkit';

const ExtractedQuestionInfoSchema = z.object({
  questionText: z.string().describe('The full text of the question.'),
  options: z.array(z.string()).describe('An array of all possible answer options for the question. Extract only the option text, without labels like "A." or "1.".'),
  correctAnswerText: z.string().describe('The exact text of the correct answer option. This must be one of the texts present in the options array. Identify this from the source, e.g., indicated by a tick mark, bolding, or an answer key if present.'),
  section: z.string().describe('The section of the exam this question belongs to. This must be one of the provided section names in the input.'),
  originalQuestionNumber: z.string().optional().describe('The original question number as it appears in the PDF, if available.'),
});

const ExtractQuestionsInputSchema = z.object({
  pdfTextContent: z
    .string()
    .describe('The text content extracted from the uploaded PDF exam file.'),
  sections: z.array(z.string()).describe('An array of section names identified in the exam. Assign each question to one of these sections.'),
  // numberOfQuestionsHint: z.number().optional().describe('An optional hint for the total number of questions expected, to guide the extraction process.'),
});
export type ExtractQuestionsInput = z.infer<typeof ExtractQuestionsInputSchema>;

const ExtractQuestionsOutputSchema = z.object({
  questions: z.array(ExtractedQuestionInfoSchema).describe('An array of extracted questions.'),
});
export type ExtractQuestionsOutput = z.infer<typeof ExtractQuestionsOutputSchema>;


export async function extractQuestions(input: ExtractQuestionsInput): Promise<ExtractQuestionsOutput> {
  return extractQuestionsFlow(input);
}

const extractQuestionsPrompt = ai.definePrompt({
  name: 'extractQuestionsPrompt',
  input: {schema: ExtractQuestionsInputSchema},
  output: {schema: ExtractQuestionsOutputSchema},
  prompt: `You are an AI assistant specialized in extracting detailed question information from exam text.
Analyze the following text extracted from a PDF exam file. For each question you identify:
1. Extract the full question text.
2. Extract all its answer options as a list of strings. IMPORTANT: Extract only the option text itself, removing any preceding labels like "A.", "1)", "i.", etc.
3. Identify and extract the exact text of the CORRECT answer. This correct answer text MUST exactly match one of the texts in the extracted options list. Look for explicit indicators of the correct answer in the source material (e.g., an answer key, a marked correct option, bold text).
4. Assign the question to one of the provided section names: {{{json sections}}}. If no specific section is discernible for a question, and a 'General' section is provided, use that. Otherwise, make your best judgment based on content if sections are topical.
5. If the question has an original number in the PDF (e.g., "Q.12", "12."), extract this number string.

The PDF text content is:
{{{pdfTextContent}}}

Return all extracted questions in a JSON object matching the output schema. Ensure each question object includes 'questionText', 'options' (array of strings), 'correctAnswerText', and 'section'. 'originalQuestionNumber' is optional.
If you cannot determine the correct answer for a question, or if a question seems incomplete, it is better to omit that question than to provide incomplete or incorrect data for 'options' or 'correctAnswerText'.
Each option in the 'options' array should be just the text of the option. For example, if the PDF shows "1. apple", extract "apple".
The 'correctAnswerText' MUST be one ofthe string values present in its corresponding 'options' array.
`,
});

const extractQuestionsFlow = ai.defineFlow(
  {
    name: 'extractQuestionsFlow',
    inputSchema: ExtractQuestionsInputSchema,
    outputSchema: ExtractQuestionsOutputSchema,
  },
  async (input: ExtractQuestionsInput) => {
    const {output} = await extractQuestionsPrompt(input);
    if (!output || !output.questions) {
        // Handle cases where AI might return a non-conforming structure or no questions
        return { questions: [] };
    }
    // Further validation could be added here, e.g., ensuring correctAnswerText is in options
    const validatedQuestions = output.questions.filter(q => 
        q.options.includes(q.correctAnswerText) && q.questionText && q.options.length > 1
    );

    return { questions: validatedQuestions };
  }
);
