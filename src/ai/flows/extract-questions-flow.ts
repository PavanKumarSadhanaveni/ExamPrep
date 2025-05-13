'use server';
/**
 * @fileOverview AI flow for extracting questions from PDF text content for a specific section.
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
  section: z.string().describe('The section of the exam this question belongs to. This MUST be the targetSectionName provided in the input.'),
  originalQuestionNumber: z.string().optional().describe('The original question number as it appears in the PDF, if available.'),
});

const ExtractQuestionsInputSchema = z.object({
  pdfTextContent: z
    .string()
    .describe('The text content extracted from the uploaded PDF exam file.'),
  allSectionNames: z.array(z.string()).describe('A list of all section names in the exam. This helps the AI understand the overall structure.'),
  targetSectionName: z.string().describe('Extract questions ONLY for this specific section. All extracted questions must be assigned to this section name.'),
});
export type ExtractQuestionsInput = z.infer<typeof ExtractQuestionsInputSchema>;

const ExtractQuestionsOutputSchema = z.object({
  questions: z.array(ExtractedQuestionInfoSchema).describe('An array of extracted questions for the target section.'),
});
export type ExtractQuestionsOutput = z.infer<typeof ExtractQuestionsOutputSchema>;


export async function extractQuestions(input: ExtractQuestionsInput): Promise<ExtractQuestionsOutput> {
  return extractQuestionsFlow(input);
}

const extractQuestionsPrompt = ai.definePrompt({
  name: 'extractQuestionsPrompt',
  input: {schema: ExtractQuestionsInputSchema},
  output: {schema: ExtractQuestionsOutputSchema},
  prompt: `You are an AI assistant specialized in extracting detailed question information from exam text for a specific section.
Analyze the following text extracted from a PDF exam file.
Your task is to extract questions ONLY from the section titled '{{{targetSectionName}}}'.
The complete list of sections in this exam is: {{{json allSectionNames}}}. Use this list for context and to ensure you are focused on the correct section.

For each question you identify within the '{{{targetSectionName}}}' section:
1. Extract the full question text.
2. Extract all its answer options as a list of strings. IMPORTANT: Extract only the option text itself, removing any preceding labels like "A.", "1)", "i.", etc.
3. Identify and extract the exact text of the CORRECT answer. This correct answer text MUST exactly match one of the texts in the extracted options list. Look for explicit indicators of the correct answer in the source material (e.g., an answer key, a marked correct option, bold text).
4. Assign the question to the section '{{{targetSectionName}}}'. This is mandatory.
5. If the question has an original number in the PDF (e.g., "Q.12", "12."), extract this number string.

The PDF text content is:
{{{pdfTextContent}}}

Return all extracted questions for '{{{targetSectionName}}}' in a JSON object matching the output schema. Ensure each question object includes 'questionText', 'options' (array of strings), 'correctAnswerText', and 'section' (which must be '{{{targetSectionName}}}'). 'originalQuestionNumber' is optional.
If you cannot determine the correct answer for a question, or if a question seems incomplete, it is better to omit that question than to provide incomplete or incorrect data for 'options' or 'correctAnswerText'.
Each option in the 'options' array should be just the text of the option. For example, if the PDF shows "1. apple", extract "apple".
The 'correctAnswerText' MUST be one of the string values present in its corresponding 'options' array.
Do NOT extract questions from any other section.
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
        return { questions: [] };
    }
    // Validate that questions are assigned to the target section and have valid structure
    const validatedQuestions = output.questions.filter(q => 
        q.section === input.targetSectionName &&
        q.options.includes(q.correctAnswerText) && 
        q.questionText && 
        q.options.length > 1
    );

    return { questions: validatedQuestions };
  }
);

