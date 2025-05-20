
"use client";

import React from 'react';
import {
  Dialog,
  DialogClose, // Import DialogClose
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle } from "lucide-react";

const ProjectInfoModal: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Project Information">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">ExamPrep Project Information</DialogTitle>
          <DialogDescription>
            An overview of the technologies, architecture, and design of this application.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow overflow-y-auto pr-6">
          <div className="space-y-6 py-4 text-sm">
            
            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">1. Technology Stack Used</h2>
              <h3 className="text-lg font-medium mt-1 mb-1">Frontend:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>Next.js (App Router)</strong> – for routing + SSR magic</li>
                <li><strong>React + TypeScript</strong> – strong types, smooth vibes</li>
                <li><strong>Tailwind CSS</strong> – for that clean, fast UI drip</li>
                <li><strong>ShadCN UI + Radix</strong> – reusable, accessible, bomb UI components</li>
                <li><strong>Lucide Icons</strong> – aesthetic icons pack</li>
                <li><strong>React Hook Form + Zod</strong> – crispy form handling with validation</li>
              </ul>

              <h3 className="text-lg font-medium mt-3 mb-1">AI / GenAI Integration:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>Genkit</strong> – the bridge to call Google Gemini models
                  <ul className="list-circle list-inside pl-6">
                    <li>Uses <code>@genkit-ai/googleai</code></li>
                  </ul>
                </li>
                <li><strong>LLM Magic:</strong> Extracts exam data + questions from PDF text using Gemini prompts</li>
              </ul>

              <h3 className="text-lg font-medium mt-3 mb-1">PDF Handling:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><code>pdfjs-dist</code> – to read/extract text from PDFs</li>
                <li><code>tesseract.js</code> – fallback OCR if text extraction is weak (image-based PDFs)</li>
              </ul>

              <h3 className="text-lg font-medium mt-3 mb-1">State Management:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>React Context API</strong> (<code>ExamContext</code>) – holds all exam state globally</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-3 mb-1">Utility Libraries:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><code>clsx</code>, <code>tailwind-merge</code> – manage Tailwind class combos</li>
                <li><code>date-fns</code> – little date helpers here and there</li>
              </ul>

              <h3 className="text-lg font-medium mt-3 mb-1">Backend (Server Stuff):</h3>
               <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>Next.js Server Actions</strong> – for form handling, AI requests etc.</li>
                <li><strong>Genkit AI Flows</strong> – AI prompt workflows to Gemini</li>
                <li><strong>Firebase Studio</strong> – your dev env (and possibly backend in the future: auth, DB, hosting)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">2. Module Structure</h2>
              <pre className="bg-secondary/30 p-3 rounded-md overflow-x-auto text-xs"><code>
{`src/
├── app/
│   ├── (exam-routes)/
│   │   ├── details/
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   ├── results/
│   │   └── test/
│   ├── suggestions/
│   ├── upload/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── actions/
├── ai/
│   ├── dev.ts
│   ├── flows/
│   └── genkit.ts
├── components/
│   ├── app/
│   └── ui/
├── contexts/
├── hooks/
├── lib/
├── public/
│   ├── slideshow/
│   │   ├── image1.png
│   │   ├── image2.png
│   │   ├── image3.png
│   │   └── image4.png
│   └── favicon.svg
└── types/`}
              </code></pre>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">3. System Architecture</h2>
              <h3 className="text-lg font-medium mt-1 mb-1">Client-Side (Browser):</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Handles UI rendering using React and ShadCN components.</li>
                <li>Manages client-side state via ExamContext and useState/useEffect.</li>
                <li><strong>PDF Processing:</strong>
                  <ul className="list-circle list-inside pl-6">
                    <li>User uploads a PDF file.</li>
                    <li><code>pdfUtils.ts</code> uses <code>pdfjs-dist</code> to attempt direct text extraction.</li>
                    <li>If direct extraction yields insufficient text, <code>tesseract.js</code> is used as an OCR fallback.</li>
                  </ul>
                </li>
                <li>Interacts with Server Actions for AI processing.</li>
                <li>Stores exam progress in <code>localStorage</code> for persistence.</li>
              </ul>
              <h3 className="text-lg font-medium mt-3 mb-1">Server-Side (Next.js Server / Server Actions):</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>Server Actions (<code>actions/examActions.ts</code>):</strong> TypeScript functions run on the server, invoked from client components.
                  <ul className="list-circle list-inside pl-6">
                    <li>Receive PDF text content from the client.</li>
                    <li>Call Genkit AI flows.</li>
                  </ul>
                </li>
                <li><strong>Genkit AI Flows (<code>ai/flows/</code>):</strong> Defined using Genkit, run on the server.
                  <ul className="list-circle list-inside pl-6">
                    <li>Use prompts to interact with Google's Gemini model.</li>
                    <li><code>extract-exam-info.ts</code>: Parses PDF text for exam metadata.</li>
                    <li><code>extract-questions-flow.ts</code>: Parses PDF text for questions, options, and answers.</li>
                  </ul>
                </li>
                <li>Next.js handles routing, static assets, and SSR of initial page shells.</li>
              </ul>
              <h3 className="text-lg font-medium mt-3 mb-1">External Services:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>Google AI (Gemini):</strong> Accessed via Genkit for NLP and information extraction.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">4. Workflow Diagram (Simplified)</h2>
              <pre className="bg-secondary/30 p-3 rounded-md overflow-x-auto text-xs"><code>
{`+----------------------+     +-------------------------+     +-------------------------+
| User (Browser)       | --> | Client-Side PDF         | --> | Server Action           |
|                      |     | Processing (pdfUtils)   |     | (extractExamInfoAction) |
| Uploads PDF          |     | (Extracts Text)         |     |                         |
+----------------------+     +-------------------------+     +-------------------------+
                                                                  |
                                                                  v
+----------------------+     +-------------------------+     +-------------------------+
| Display Exam Details | <-- | Client (ExamContext)    | <-- | Genkit AI Flow          |
| (ExamDetailsDisplay) |     | (Receives Metadata)     |     | (extractExamInfo)       |
+----------------------+     +-------------------------+     +-------------------------+
       |
       | (Lazy load questions for first/next section)
       v
+----------------------+     +-------------------------+     +-------------------------+
| Client (ExamContext) | --> | Server Action           | --> | Genkit AI Flow          |
| Requests Questions   |     | (extractQuestionsAction)|     | (extractQuestions)      |
+----------------------+     +-------------------------+     +-------------------------+
       |
       v
+----------------------+     +-------------------------+
| User Takes Exam      | --> | Client (ExamContext)    |
| (TestInterfaceClient)|     | (Stores Answers)        |
+----------------------+     +-------------------------+
       |
       v
+----------------------+     +-------------------------+
| User Submits Exam    | --> | Client-Side Results     |
|                      |     | Calculation (resultsUtils)|
+----------------------+     +-------------------------+
       |
       v
+----------------------+
| Display Results      |
| (ResultsDisplayClient)|
+----------------------+`}
              </code></pre>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">5. Usecase Diagram (Mermaid Format)</h2>
              <pre className="bg-secondary/30 p-3 rounded-md overflow-x-auto text-xs"><code>
{`graph TD
    A[User] --> |Uploads PDF| B(Upload PDF File)
    B --> C{{Process PDF}}
    C -- Direct Text --> D[Extract Text (pdfjs-dist)]
    C -- Image/Low Text --> E[Perform OCR (tesseract.js)]
    D --> F[Send Text to Server]
    E --> F
    F --> G[Server: Extract Exam Metadata (AI)]
    G --> H[Display Exam Metadata]
    A --> H
    H --> I[User: Review/Edit Metadata]
    I --> J[User: Start Exam]
    J --> K[System: Load Questions for Section (AI)]
    A --> |Takes Exam| L(Answer Questions)
    L --> M[System: Store Answers]
    A --> |Requests Hint| MA(Request AI Hint)
    MA --> MB[Server: Generate Hint (AI)]
    MB --> MC[Display Hint]
    A --> MC
    A --> |Navigates Sections/Questions| N(Navigate Exam)
    N --> K
    A --> |Pauses/Resumes Exam| O(Manage Exam State)
    A --> |Submits Exam| P(Submit Exam)
    P --> Q[System: Calculate Results]
    Q --> R[Display Results]
    A --> R
    A --> |Views PDF Processing Suggestions| S(View Suggestions)`}
              </code></pre>
              <p className="text-xs text-muted-foreground mt-1"> (This can be rendered using a Mermaid visualizer.)</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">6. Class Diagram (Simplified - Mermaid Format)</h2>
              <pre className="bg-secondary/30 p-3 rounded-md overflow-x-auto text-xs"><code>
{`classDiagram
    class ExamData {
        +pdfTextContent: string | null
        +examInfo: ExtractExamInfoOutput | null
        +questions: Question[]
        +currentSection: string | null
        +currentQuestionIndex: number
        +userAnswers: UserAnswer[]
        +startTime: number | null
        +endTime: number | null
        +isPaused: boolean
    }
    class ExtractExamInfoOutput {
        +examName: string
        +overallDuration: string
        +overallTotalMarks: number?
        +overallNumberOfQuestions: number?
        +overallNegativeMarking: string?
        +subjects: SubjectDetail[]
        +sections: string[] # Flat list of unique section identifiers
        +questionBreakdown: string?
    }
    class SubjectDetail {
        +subjectName: string
        +subjectSections: SectionDetail[]
        +subjectDuration: string?
        +totalMarksForSubject: number?
        +numberOfQuestionsInSubject: number?
    }
    class SectionDetail {
        +sectionNameOrType: string
        +numberOfQuestions: number?
        +marksPerQuestion: number?
        +totalMarksForSection: number?
    }
    class Question {
        +id: string
        +questionText: string
        +options: string[]
        +correctAnswer: string
        +section: string
        +originalPdfQuestionNumber: string?
    }
    class UserAnswer {
        +questionId: string
        +selectedOption: string | null
        +isCorrect: boolean | null
        +timeTaken: number
        +hintsTaken: Array~HintRecord~
    }
    class HintRecord {
        +level: number
        +timestamp: number
    }
    ExamData "1" *-- "0..*" Question
    ExamData "1" *-- "0..*" UserAnswer
    ExamData "1" *-- "1" ExtractExamInfoOutput
    ExtractExamInfoOutput "1" *-- "0..*" SubjectDetail
    SubjectDetail "1" *-- "0..*" SectionDetail`}
              </code></pre>
              <p className="text-xs text-muted-foreground mt-1"> (This can be rendered using a Mermaid visualizer.)</p>
            </section>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectInfoModal;

    