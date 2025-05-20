
"use client";

import React from 'react'; // Changed from 'import type React from 'react';'
import {
  Dialog,
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
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>Frontend Framework:</strong> Next.js (with App Router)</li>
                <li><strong>UI Library:</strong> React</li>
                <li><strong>Language:</strong> TypeScript</li>
                <li><strong>Styling:</strong> Tailwind CSS</li>
                <li><strong>UI Components:</strong> ShadCN UI (Radix UI + Tailwind)</li>
                <li><strong>AI Integration:</strong> Genkit (Google Gemini)
                  <ul className="list-circle list-inside pl-6">
                    <li>Google AI (via @genkit-ai/googleai)</li>
                  </ul>
                </li>
                <li><strong>PDF Processing (Client-Side):</strong>
                  <ul className="list-circle list-inside pl-6">
                    <li><code>pdfjs-dist</code>: Primary text extraction.</li>
                    <li><code>tesseract.js</code>: OCR fallback.</li>
                  </ul>
                </li>
                <li><strong>State Management:</strong> React Context API (ExamContext)</li>
                <li><strong>Form Handling:</strong> React Hook Form + Zod</li>
                <li><strong>Utility Libraries:</strong> clsx, tailwind-merge, lucide-react, date-fns</li>
                <li><strong>Development Environment:</strong> Firebase Studio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">2. Module Structure</h2>
              <pre className="bg-secondary/30 p-3 rounded-md overflow-x-auto"><code>
src/
├── app/
│   ├── (exam-routes)/
│   │   ├── details/
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   ├── results/
│   │   └── test/
│   ├── suggestions/
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
└── types/
              </code></pre>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">3. System Architecture</h2>
              <h3 className="text-lg font-medium mt-1 mb-1">Client-Side (Browser):</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>UI Rendering: React, ShadCN components.</li>
                <li>State Management: ExamContext, useState/useEffect.</li>
                <li>PDF Processing: User uploads PDF. `pdfUtils.ts` uses `pdfjs-dist` (primary) and `tesseract.js` (OCR fallback).</li>
                <li>Interaction: Calls Server Actions for AI tasks. Stores progress in localStorage.</li>
              </ul>
              <h3 className="text-lg font-medium mt-3 mb-1">Server-Side (Next.js Server / Server Actions):</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Server Actions (`actions/examActions.ts`): Handle AI processing requests from client. Call Genkit flows.</li>
                <li>Genkit AI Flows (`ai/flows/`): Server-side logic using Genkit and Google Gemini to extract exam metadata and questions from text.</li>
                <li>Next.js: Routing, static asset serving, SSR initial shells.</li>
              </ul>
              <h3 className="text-lg font-medium mt-3 mb-1">External Services:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Google AI (Gemini): For NLP and information extraction via Genkit.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">4. Workflow Diagram (Simplified)</h2>
              <pre className="bg-secondary/30 p-3 rounded-md overflow-x-auto"><code>
User (Browser) -- Uploads PDF --> Client PDF Processing -- Extracted Text --> Server Action (extractExamInfo)
Server Action --> Genkit AI Flow (extractExamInfo) -- Exam Metadata --> Client (ExamContext)
Client --> Display Exam Details
Client (ExamContext) -- Requests Questions --> Server Action (extractQuestions) -- Text, SectionInfo --> Genkit AI Flow (extractQuestions)
Genkit AI Flow -- Extracted Questions --> Client (ExamContext)
Client --> User Takes Exam (Stores Answers)
Client --> User Submits Exam --> Client-Side Results Calculation
Client --> Display Results
              </code></pre>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">5. Usecase Diagram (Mermaid Format)</h2>
              <pre className="bg-secondary/30 p-3 rounded-md overflow-x-auto"><code>
graph TD
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
    A --> |Views PDF Processing Suggestions| S(View Suggestions)
              </code></pre>
              <p className="text-xs text-muted-foreground mt-1"> (This can be rendered using a Mermaid visualizer.)</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2 text-primary">6. Class Diagram (Simplified - Mermaid Format)</h2>
              <pre className="bg-secondary/30 p-3 rounded-md overflow-x-auto"><code>
classDiagram
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
        +subjects: SubjectDetail[]
        +sections: string[]
    }
    class SubjectDetail {
        +subjectName: string
        +subjectSections: SectionDetail[]
    }
    class SectionDetail {
        +sectionNameOrType: string
        +numberOfQuestions: number?
        +marksPerQuestion: number?
    }
    class Question {
        +id: string
        +questionText: string
        +options: string[]
        +correctAnswer: string
        +section: string
    }
    class UserAnswer {
        +questionId: string
        +selectedOption: string | null
        +isCorrect: boolean | null
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
    SubjectDetail "1" *-- "0..*" SectionDetail
              </code></pre>
              <p className="text-xs text-muted-foreground mt-1"> (This can be rendered using a Mermaid visualizer.)</p>
            </section>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => (document.querySelector('[data-radix-dialog-close]') as HTMLElement)?.click()}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectInfoModal;
