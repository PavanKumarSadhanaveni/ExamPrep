
'use server';

/**
 * @fileOverview Exam information extraction flow.
 *
 * This flow automatically extracts exam details such as name, duration, subjects, sections within subjects, 
 * question breakdown, marks, and negative marking from the uploaded PDF content.
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

const SectionDetailSchema = z.object({
  sectionNameOrType: z.string().describe("Name or type of the section (e.g., 'Section A', 'MCQs', 'Reading Comprehension'). This should be unique within its parent subject if possible."),
  numberOfQuestions: z.number().optional().describe("Number of questions in this section."),
  marksPerQuestion: z.number().optional().describe("Marks allocated per question in this section, if uniform."),
  totalMarksForSection: z.number().optional().describe("Total marks for this section, if specified directly."),
});
export type SectionDetail = z.infer<typeof SectionDetailSchema>;

const SubjectDetailSchema = z.object({
  subjectName: z.string().describe("Name of the subject (e.g., 'Physics', 'Telugu', 'General Aptitude')."),
  subjectSections: z.array(SectionDetailSchema).describe("Detailed breakdown of sections within this subject."),
  subjectDuration: z.string().optional().describe("Specific time duration for this subject, if mentioned (e.g., '30 minutes')."),
  totalMarksForSubject: z.number().optional().describe("Total marks for this subject, if specified directly or can be summed from its sections."),
  numberOfQuestionsInSubject: z.number().optional().describe("Total number of questions in this subject, if specified or can be summed from its sections."),
});
export type SubjectDetail = z.infer<typeof SubjectDetailSchema>;

const ExtractExamInfoOutputSchema = z.object({
  examName: z.string().describe("The name of the exam."),
  overallDuration: z.string().describe("The total duration of the exam (e.g., '2 hours', '90 minutes')."),
  overallTotalMarks: z.number().optional().describe("The total marks for the entire exam, if specified or can be summed from subjects/sections."),
  overallNumberOfQuestions: z.number().optional().describe("The total number of questions in the entire exam, if specified or can be summed from subjects/sections."),
  overallNegativeMarking: z.string().optional().describe("General negative marking policy for the exam, if any (e.g., '0.25 marks deducted for each wrong answer', 'No negative marking')."),
  
  subjects: z.array(SubjectDetailSchema).describe("An array detailing each subject found in the exam. If the exam is not divided by subject but directly into sections, you can model this as a single 'General' subject containing all sections."),
  
  sections: z.array(z.string()).describe(
    "A flat list of all unique section identifiers across all subjects, formatted like 'Subject Name - Section Name/Type' (e.g., ['Physics - Section A', 'Telugu - MCQs']). If there's only one subject or sections are not nested under subjects, then just the section names (e.g. ['Section A', 'Section B']). This list is crucial for subsequent question extraction."
  ),
  
  questionBreakdown: z.string().optional().describe(
    "A general textual summary of the question and mark distribution across sections/subjects. This can be a fallback or high-level overview."
  ),
});
export type ExtractExamInfoOutput = z.infer<typeof ExtractExamInfoOutputSchema>;

export async function extractExamInfo(input: ExtractExamInfoInput): Promise<ExtractExamInfoOutput> {
  return extractExamInfoFlow(input);
}

const extractExamInfoPrompt = ai.definePrompt({
  name: 'extractExamInfoPrompt',
  input: {schema: ExtractExamInfoInputSchema},
  output: {schema: ExtractExamInfoOutputSchema},
  prompt: `You are an AI assistant specialized in extracting detailed exam structure and metadata from text content.
Analyze the following text extracted from a PDF exam file. Your goal is to identify all subjects, their sections, and details about questions and marks for each.

Provide the output in JSON format matching the schema.

Key instructions for output:
1.  **Subjects Array**: Identify distinct subjects (e.g., "Physics", "Telugu", "Mathematics"). For each subject:
    *   \`subjectName\`: The name of the subject.
    *   \`subjectSections\`: An array detailing each section within that subject. For each section:
        *   \`sectionNameOrType\`: e.g., "Section A", "MCQs", "Comprehension".
        *   \`numberOfQuestions\`: How many questions.
        *   \`marksPerQuestion\`: If uniform.
        *   \`totalMarksForSection\`: If specified.
    *   \`subjectDuration\`: If the subject has its own time limit.
    *   \`totalMarksForSubject\`: Total marks for the subject. Sum from sections if not explicitly stated for the subject.
    *   \`numberOfQuestionsInSubject\`: Total questions in the subject. Sum from sections if not explicitly stated for the subject.
2.  **Overall Details**:
    *   \`examName\`: Full name of the examination.
    *   \`overallDuration\`: Total time for the entire exam.
    *   \`overallTotalMarks\`: Total marks for the whole exam. Sum from subjects if not explicitly stated.
    *   \`overallNumberOfQuestions\`: Total questions in the whole exam. Sum from subjects if not explicitly stated.
    *   \`overallNegativeMarking\`: Any general negative marking rule.
3.  **Crucial \`sections\` field (Flat List)**: This is a flat array of strings. For every section you identify under any subject, create a unique string identifier here. The format should preferably be 'Subject Name - Section Name/Type'.
    *   Example: If "Physics" has "Section A" and "Section B", and "Chemistry" has "Section A", this list should be: \`["Physics - Section A", "Physics - Section B", "Chemistry - Section A"]\`.
    *   If the exam doesn't have distinct subjects and just top-level sections (e.g. "Section 1", "Section 2"), then this list would be \`["Section 1", "Section 2"]\`. In this case, the \`subjects\` array in the output should contain a single "General" subject holding these sections.
    *   This list is vital for the next step of extracting questions for each specific part. Ensure every part of the exam that contains questions is represented by a unique string in this list.
4.  **\`questionBreakdown\` (Text Summary)**: Provide a general textual summary of the exam structure, especially if some details are ambiguous for the strict JSON schema.

EXAMPLE:
Input Text:
"ANNUAL EXAMINATION - 2024
Total Time: 3 Hours Total Marks: 300
The exam has three parts: Part I: Physics, Part II: Chemistry, Part III: Mathematics. Each part is for 100 marks and 1 hour.
Part I: Physics
  Section A: 10 MCQs, 2 marks each. No negative marking.
  Section B: 5 Structured Questions, 6 marks each.
Part II: Chemistry
  Section A: 15 MCQs, 2 marks each. -0.5 for wrong.
  Section B: 4 Problem Solving, 5 marks each.
Part III: Mathematics
  All questions compulsory. 20 questions, 5 marks each.

Additional Subject: Telugu (Qualifying) - 30 mins, 50 marks
  Section 1: Reading - 10 Qs, 2 marks/Q
  Section 2: Grammar - 15 Qs, 2 marks/Q
"

Expected Output (Illustrative):
{
  "examName": "ANNUAL EXAMINATION - 2024",
  "overallDuration": "3 Hours",
  "overallTotalMarks": 350,
  "overallNumberOfQuestions": 79, // 15+19+20+25
  "overallNegativeMarking": "Part II: Chemistry Section A: -0.5 for wrong. Other sections vary or not specified.",
  "subjects": [
    {
      "subjectName": "Physics",
      "subjectSections": [
        { "sectionNameOrType": "Section A", "numberOfQuestions": 10, "marksPerQuestion": 2, "totalMarksForSection": 20 },
        { "sectionNameOrType": "Section B", "numberOfQuestions": 5, "marksPerQuestion": 6, "totalMarksForSection": 30 }
      ],
      "subjectDuration": "1 hour",
      "totalMarksForSubject": 100, 
      "numberOfQuestionsInSubject": 15
    },
    {
      "subjectName": "Chemistry",
      "subjectSections": [
        { "sectionNameOrType": "Section A", "numberOfQuestions": 15, "marksPerQuestion": 2, "totalMarksForSection": 30 },
        { "sectionNameOrType": "Section B", "numberOfQuestions": 4, "marksPerQuestion": 5, "totalMarksForSection": 20 }
      ],
      "subjectDuration": "1 hour",
      "totalMarksForSubject": 100, 
      "numberOfQuestionsInSubject": 19
    },
    {
      "subjectName": "Mathematics",
      "subjectSections": [
        { "sectionNameOrType": "All questions", "numberOfQuestions": 20, "marksPerQuestion": 5, "totalMarksForSection": 100 }
      ],
      "subjectDuration": "1 hour",
      "totalMarksForSubject": 100,
      "numberOfQuestionsInSubject": 20
    },
    {
      "subjectName": "Telugu",
      "subjectSections": [
        { "sectionNameOrType": "Reading", "numberOfQuestions": 10, "marksPerQuestion": 2, "totalMarksForSection": 20 },
        { "sectionNameOrType": "Grammar", "numberOfQuestions": 15, "marksPerQuestion": 2, "totalMarksForSection": 30 }
      ],
      "subjectDuration": "30 mins",
      "totalMarksForSubject": 50,
      "numberOfQuestionsInSubject": 25
    }
  ],
  "sections": [
    "Physics - Section A",
    "Physics - Section B",
    "Chemistry - Section A",
    "Chemistry - Section B",
    "Mathematics - All questions",
    "Telugu - Reading",
    "Telugu - Grammar"
  ],
  "questionBreakdown": "The exam has Physics (Section A: 10 MCQs, 2 marks each; Section B: 5 Structured Questions, 6 marks each), Chemistry (Section A: 15 MCQs, 2 marks each, -0.5 for wrong; Section B: 4 Problem Solving, 5 marks each), Mathematics (20 questions, 5 marks each), and Telugu (Reading: 10 Qs, 2 marks/Q; Grammar: 15 Qs, 2 marks/Q)."
}

If information is not clearly available for a field, omit it.
Focus on extracting details accurately. If the document structure is very flat (e.g. just "Section 1, Section 2, ... Section N" without explicit subjects), model it as one subject named "General Exam" (or similar) containing all those sections. The flat \`sections\` list would then just be \`["Section 1", "Section 2", ..., "Section N"]\`.

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
  async (input: ExtractExamInfoInput): Promise<ExtractExamInfoOutput> => {
    const {output} = await extractExamInfoPrompt(input);
    if (!output) {
        throw new Error("AI failed to extract exam information.");
    }

    // Post-processing to ensure data integrity
    if (output.subjects && output.subjects.length > 0) {
      // Ensure each subject has summed up totals if AI missed it
      output.subjects.forEach(subject => {
        if (subject.numberOfQuestionsInSubject === undefined || subject.numberOfQuestionsInSubject === null) {
          subject.numberOfQuestionsInSubject = subject.subjectSections.reduce((sum, sec) => sum + (sec.numberOfQuestions || 0), 0);
          if (subject.numberOfQuestionsInSubject === 0) subject.numberOfQuestionsInSubject = undefined;
        }
        if (subject.totalMarksForSubject === undefined || subject.totalMarksForSubject === null) {
          subject.totalMarksForSubject = subject.subjectSections.reduce((sum, sec) => sum + (sec.totalMarksForSection || ( (sec.numberOfQuestions || 0) * (sec.marksPerQuestion || 0) ) || 0), 0);
          if (subject.totalMarksForSubject === 0) subject.totalMarksForSubject = undefined;
        }
      });

      // Derive flat sections list if AI missed it or did it poorly
      const derivedSections: string[] = [];
      output.subjects.forEach(subject => {
        subject.subjectSections.forEach(section => {
          // Handle cases where subject might be "General Exam" and sectionNameOrType is "Section A"
          // If subject.subjectName is generic like "General" or "Main", don't prepend it if not necessary.
          const sectionPrefix = (output.subjects.length === 1 && (subject.subjectName.toLowerCase().includes("general") || subject.subjectName.toLowerCase().includes("main"))) ? "" : `${subject.subjectName} - `;
          derivedSections.push(`${sectionPrefix}${section.sectionNameOrType}`);
        });
      });
      
      if (derivedSections.length > 0 && (!output.sections || output.sections.length === 0 || output.sections.length !== derivedSections.length)) {
        // Prioritize derived sections if AI's list is missing or significantly different
        // This check can be refined based on observed AI behavior
        console.log("Derived/updated flat sections list from structured subjects data for consistency:", derivedSections);
        output.sections = [...new Set(derivedSections)]; // Ensure uniqueness
      }


      // Sum up overallTotalMarks and overallNumberOfQuestions if not provided by AI
      if (output.overallTotalMarks === undefined || output.overallTotalMarks === null) {
          output.overallTotalMarks = output.subjects.reduce((sum, subj) => sum + (subj.totalMarksForSubject || 0), 0);
          if (output.overallTotalMarks === 0) output.overallTotalMarks = undefined;
      }
      if (output.overallNumberOfQuestions === undefined || output.overallNumberOfQuestions === null) {
          output.overallNumberOfQuestions = output.subjects.reduce((sum, subj) => sum + (subj.numberOfQuestionsInSubject || 0), 0);
           if (output.overallNumberOfQuestions === 0) output.overallNumberOfQuestions = undefined;
      }
    }
    
    // Fallback if sections list is still empty but questionBreakdown exists
    if ((!output.sections || output.sections.length === 0) && output.questionBreakdown && output.questionBreakdown !== "Not specified") {
        console.warn("Flat 'sections' list is empty. Further processing might be needed based on 'questionBreakdown' if AI failed to structure subjects/sections properly.");
        // Potentially, more sophisticated regex could parse questionBreakdown here if the structured output failed.
        // For now, this is a warning. The UI/context might need to handle cases where `output.sections` is empty.
    }


    return output;
  }
);

