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
  options: z.array(z.string()).min(2).describe('An array of all possible answer options for the question (minimum 2 options). Extract only the option text, without labels like "A." or "1.".'),
  correctAnswerText: z.string().describe('The exact text of the correct answer option. This must be one of the texts present in the options array. Identify this from the source, e.g., indicated by a tick mark, bolding, or an answer key if present.'),
  section: z.string().describe('The section of the exam this question belongs to. This MUST be the targetSectionName provided in the input.'),
  originalQuestionNumber: z.string().optional().describe('The original question number as it appears in the PDF, if available (e.g., "1.", "Q12").'),
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
2. Extract all its answer options as a list of strings (minimum 2 options). IMPORTANT: Extract only the option text itself, removing any preceding labels like "A.", "1)", "i.", etc.
3. Identify and extract the exact text of the CORRECT answer. This correct answer text MUST exactly match one of the texts in the extracted options list. Look for explicit indicators of the correct answer in the source material (e.g., an answer key, a marked correct option, bold text).
4. Assign the question to the section '{{{targetSectionName}}}'. This is mandatory.
5. If the question has an original number in the PDF (e.g., "Q.12", "12."), extract this number string.

EXAMPLE:
Input Text (snippet for section "Physics"):
"...
Section: Physics
...
1. What is the SI unit of force?
   (A) Watt
   (B) Joule
   (C) Newton *
   (D) Pascal
2. Which law states that for every action, there is an equal and opposite reaction?
   a) Ohm's Law
   b) Newton's First Law
   c) Newton's Third Law  [Correct]
   d) Kepler's Law
..."
Target Section Name: "Physics"
All Section Names: ["Physics", "Chemistry"]

Expected Output for "Physics" section:
{
  "questions": [
    {
      "questionText": "What is the SI unit of force?",
      "options": ["Watt", "Joule", "Newton", "Pascal"],
      "correctAnswerText": "Newton",
      "section": "Physics",
      "originalQuestionNumber": "1."
    },
    {
      "questionText": "Which law states that for every action, there is an equal and opposite reaction?",
      "options": ["Ohm's Law", "Newton's First Law", "Newton's Third Law", "Kepler's Law"],
      "correctAnswerText": "Newton's Third Law",
      "section": "Physics",
      "originalQuestionNumber": "2."
    }
  ]
}


The PDF text content is:
{{{pdfTextContent}}}

Return all extracted questions for '{{{targetSectionName}}}' in a JSON object matching the output schema. Ensure each question object includes 'questionText', 'options' (array of strings, min 2), 'correctAnswerText', and 'section' (which must be '{{{targetSectionName}}}'). 'originalQuestionNumber' is optional.
If you cannot determine the correct answer for a question, or if a question seems incomplete (e.g., less than 2 options), it is better to omit that question than to provide incomplete or incorrect data.
Each option in the 'options' array should be just the text of the option. For example, if the PDF shows "1. apple", extract "apple".
The 'correctAnswerText' MUST be one of the string values present in its corresponding 'options' array.
Do NOT extract questions from any other section. If no questions are found for the target section, return an empty questions array.
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
        console.warn(`AI returned no questions or malformed output for section: ${input.targetSectionName}`);
        return { questions: [] };
    }
    
    const validatedQuestions = output.questions.filter(q => {
        const isValid = 
            q.section === input.targetSectionName &&
            q.questionText && q.questionText.trim() !== "" &&
            q.options && q.options.length >= 2 && // Ensure at least 2 options
            q.options.every(opt => typeof opt === 'string' && opt.trim() !== "") && // Options are non-empty strings
            q.correctAnswerText && q.correctAnswerText.trim() !== "" &&
            q.options.includes(q.correctAnswerText);

        if (!isValid) {
            console.warn(`Invalid question structure filtered out for section ${input.targetSectionName}:`, q);
        }
        return isValid;
    });

    if (validatedQuestions.length < output.questions.length) {
        console.log(`Filtered out ${output.questions.length - validatedQuestions.length} invalid questions for section ${input.targetSectionName}.`);
    }
    
    if (validatedQuestions.length === 0) {
        console.log(`No valid questions extracted for section: ${input.targetSectionName} after validation.`);
    }

    return { questions: validatedQuestions };
  }
);
