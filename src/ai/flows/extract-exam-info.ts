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
  duration: z.string().describe('The duration of the exam (e.g., "2 hours", "90 minutes").'),
  sections: z
    .array(z.string())
    .describe('The sections of the exam (e.g., ["Section A: Physics", "Section B: Chemistry"]). Extract full section names if available.'),
  questionBreakdown: z
    .string()
    .describe('A summary of the question breakdown for each section if explicitly stated (e.g., "Section A has 20 questions, Section B has 30 questions."). Otherwise, a general statement like "Not specified".'),
  totalMarks: z.number().optional().describe('The total marks for the exam.'),
  numberOfQuestions: z
    .number()
    .optional()
    .describe('The total number of questions in the exam.'),
  marksPerQuestion: z
    .number()
    .optional()
    .describe('The marks allocated to each question, if uniform. If it varies, this can be omitted or set to a general value if specified (e.g. "1 mark per question").'),
  negativeMarking: z
    .string()
    .optional()
    .describe('Details about negative marking, if any (e.g., "0.25 marks deducted for each wrong answer", "No negative marking").'),
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
Analyze the following text extracted from a PDF exam file and identify the exam name, duration, sections, and question breakdown. Also, extract the total marks, total number of questions, marks per question, and negative marking details if they are available.

Provide the output in JSON format matching the schema.

EXAMPLE:
Input Text:
"NATIONAL SCIENCE OLYMPIAD - 2024
Duration: 1 hour 30 minutes Total Marks: 100
Instructions:
The paper is divided into three sections:
Section A: Physics (30 Questions, 1 mark each)
Section B: Chemistry (30 Questions, 1 mark each)
Section C: Biology (40 Questions, 1 mark each, 0.25 negative for wrong answer)
Total questions: 100"

Expected Output:
{
  "examName": "NATIONAL SCIENCE OLYMPIAD - 2024",
  "duration": "1 hour 30 minutes",
  "sections": ["Section A: Physics", "Section B: Chemistry", "Section C: Biology"],
  "questionBreakdown": "Section A: Physics (30 Questions, 1 mark each), Section B: Chemistry (30 Questions, 1 mark each), Section C: Biology (40 Questions, 1 mark each, 0.25 negative for wrong answer)",
  "totalMarks": 100,
  "numberOfQuestions": 100,
  "marksPerQuestion": 1,
  "negativeMarking": "0.25 negative for wrong answer in Section C: Biology"
}

If certain information (e.g., marksPerQuestion if it varies, or questionBreakdown if not detailed) is not clearly available or is too complex to summarize concisely, omit the field or provide a sensible default like "Varies" or "Not specified".
Ensure section names are as descriptive as possible (e.g., "Section A: Physics" instead of just "Section A" if the subject is mentioned).

Text Content:
{{{pdfTextContent}}}
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
    if (!output) {
        throw new Error("AI failed to extract exam information.");
    }
    // Basic validation: if sections are empty but questionBreakdown mentions sections, try to populate.
    // This is a simple example; more complex post-processing can be added.
    if ((!output.sections || output.sections.length === 0) && output.questionBreakdown && output.questionBreakdown !== "Not specified") {
        // A more sophisticated regex might be needed here based on common patterns.
        // This is a placeholder for potential post-processing logic.
        console.log("Attempting to derive sections from questionBreakdown if sections array is empty.");
    }
    return output;
  }
);
