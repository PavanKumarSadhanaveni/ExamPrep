'use server';

/**
 * @fileOverview Exam information extraction flow.
 *
 * This flow automatically extracts exam details such as name, duration, sections, and question breakdown from the uploaded PDF content.
 *
 * @function extractExamInfo - The main function to trigger the exam info extraction flow.
 * @typedef {ExtractExamInfoInput} ExtractExamInfoInput - Input type for the extractExamInfo function.
 * @typedef {ExtractExamInfoOutput} ExtractExamInfoOutput - Output type for the extractExamInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractExamInfoInputSchema = z.object({
  pdfTextContent: z
    .string()
    .describe('The text content extracted from the uploaded PDF exam file.'),
});
export type ExtractExamInfoInput = z.infer<typeof ExtractExamInfoInputSchema>;

const ExtractExamInfoOutputSchema = z.object({
  examName: z.string().describe('The name of the exam.'),
  duration: z.string().describe('The duration of the exam (e.g., 2 hours).'),
  sections: z
    .array(z.string())
    .describe('The sections of the exam (e.g., Section A, Section B).'),
  questionBreakdown: z
    .string()
    .describe('A summary of the question breakdown for each section.'),
  totalMarks: z.number().optional().describe('The total marks for the exam.'),
  numberOfQuestions: z
    .number()
    .optional()
    .describe('The total number of questions in the exam.'),
  marksPerQuestion: z
    .number()
    .optional()
    .describe('The marks allocated to each question.'),
  negativeMarking: z
    .string()
    .optional()
    .describe('Details about negative marking, if any.'),
});
export type ExtractExamInfoOutput = z.infer<typeof ExtractExamInfoOutputSchema>;

export async function extractExamInfo(input: ExtractExamInfoInput): Promise<ExtractExamInfoOutput> {
  return extractExamInfoFlow(input);
}

const extractExamInfoPrompt = ai.definePrompt({
  name: 'extractExamInfoPrompt',
  input: {schema: ExtractExamInfoInputSchema},
  output: {schema: ExtractExamInfoOutputSchema},
  prompt: `You are an AI assistant specialized in extracting exam details from text content.
  Analyze the following text extracted from a PDF exam file and identify the exam name, duration, sections, and question breakdown. Also, extract the total marks, number of questions, marks per question, and negative marking details if they are available.

  Text Content: {{{pdfTextContent}}}

  Provide the output in JSON format.
  `,
});

const extractExamInfoFlow = ai.defineFlow(
  {
    name: 'extractExamInfoFlow',
    inputSchema: ExtractExamInfoInputSchema,
    outputSchema: ExtractExamInfoOutputSchema,
  },
  async input => {
    const {output} = await extractExamInfoPrompt(input);
    return output!;
  }
);
