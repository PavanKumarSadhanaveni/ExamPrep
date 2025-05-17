
'use server';
/**
 * @fileOverview AI flow for generating hints for exam questions.
 *
 * - generateHint - A function that provides a hint based on the question, options, and hint level.
 * - GenerateHintInput - The input type for the generateHint function.
 * - GenerateHintOutput - The return type for the generateHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHintInputSchema = z.object({
  questionText: z.string().describe('The full text of the question for which a hint is needed.'),
  options: z.array(z.string()).min(2).describe('An array of all possible answer options for the question.'),
  hintLevel: z.number().min(1).max(3).describe('The level of hint required (1 for general, 2 for method, 3 for specific step/clue).'),
  examContextText: z.string().optional().describe('Optional: A snippet of the overall exam text content for broader context, if available and relevant. Limit to first 5000 chars if providing.'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('The generated hint text.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;

export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const generateHintPrompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: {schema: GenerateHintInputSchema},
  output: {schema: GenerateHintOutputSchema},
  prompt: `You are an AI assistant designed to provide helpful hints for exam questions without giving away the direct answer.
The user is working on the following question:
Question: "{{{questionText}}}"
Options:
{{#each options}}
- {{{this}}}
{{/each}}

The user has requested a hint at level {{{hintLevel}}}.
Provide a hint according to the level:
- Level 1: Identify the general topic, subject area, or a very broad concept related to the question.
- Level 2: Suggest a specific method, formula, principle, or a general approach to solve the problem.
- Level 3: Give a more specific clue, a starting step, or point towards a key piece of information within the question or options that might be overlooked.

Example:
Question: "What is the capital of France?"
Options: ["Berlin", "Madrid", "Paris", "Rome"]

Level 1 Hint: "This question is about European geography."
Level 2 Hint: "Think about famous landmarks and government seats in major European countries."
Level 3 Hint: "The city is known for the Eiffel Tower."

Do NOT reveal the correct answer. The hint should guide the user, not solve it for them.
{{#if examContextText}}
You can also use the following general exam context if it helps in understanding the type of question:
Context (first 5000 chars): {{{examContextText}}}
{{/if}}
Generate the hint now.
`,
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async (input: GenerateHintInput): Promise<GenerateHintOutput> => {
    const {output} = await generateHintPrompt(input);
    if (!output || !output.hint) {
      // Fallback hint if AI fails to generate one
      let fallbackHint = "I'm having a bit of trouble generating a specific hint right now. Try thinking about the core concepts related to the question.";
      if (input.hintLevel === 1) fallbackHint = "Consider the main subject or topic this question might belong to.";
      if (input.hintLevel === 2) fallbackHint = "Is there a particular formula or common approach used for questions like this?";
      if (input.hintLevel === 3) fallbackHint = "Look closely at the wording of the question and each option. Is there anything that seems unusual or a key detail?";
      
      console.warn("AI failed to generate a hint, providing fallback.");
      return { hint: fallbackHint };
    }
    return output;
  }
);
