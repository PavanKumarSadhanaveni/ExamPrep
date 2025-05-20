
"use client";

import React from 'react'; // Full import for React
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Briefcase, GraduationCap, Brain, Code, Award, UserCircle, Phone, Mail, Linkedin, MapPin } from "lucide-react";

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
│   │   ├── image4.png
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

            <section className="pt-6 border-t mt-6">
              <h2 className="text-xl font-semibold mb-4 text-primary flex items-center">
                <UserCircle className="mr-2 h-6 w-6" /> Developer Information
              </h2>

              <div className="text-center mb-8 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg shadow">
                <h1 className="text-3xl font-bold text-primary">Pavan Kumar Sadhanaveni</h1>
                <p className="text-md text-foreground font-medium">Entry Level Graduate | Software Developer</p>
                <div className="mt-3 text-xs text-muted-foreground flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                  <span className="flex items-center"><Phone className="inline h-3.5 w-3.5 mr-1"/>+91 7075071288</span>
                  <span className="flex items-center"><Mail className="inline h-3.5 w-3.5 mr-1"/>pavankumarsadhanaveni@gmail.com</span>
                  <a href="https://www.linkedin.com/in/pavankumarsadhanaveni/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary hover:underline">
                    <Linkedin className="inline h-3.5 w-3.5 mr-1"/>LinkedIn/in/PavanKumarSadhanaveni
                  </a>
                  <span className="flex items-center"><MapPin className="inline h-3.5 w-3.5 mr-1"/>Hyderabad</span>
                </div>
              </div>
              
              <div className="mb-6 p-4 bg-secondary/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-1 text-foreground">Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Aspiring Software Developer seeking an entry-level role to apply skills in Java, SQL and web technologies like HTML, CSS, and JavaScript. Aiming to contribute to efficient software solutions in an active team environment and ensure solutions meet business needs.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-card border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary" />Education</h3>
                  <div className="mb-3">
                    <h4 className="font-medium">Bachelor of Technology in Computer Science and Engineering/Cybersecurity</h4>
                    <p className="text-xs text-muted-foreground">CVR College of Engineering | Dec 2021 – Apr 2025</p>
                    <p className="text-xs">CGPA – 7.65</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Board of Intermediate Education</h4>
                    <p className="text-xs text-muted-foreground">Narayana Junior College | Jun 2019 – Apr 2021</p>
                    <p className="text-xs">Percentage – 88%</p>
                  </div>
                </div>

                <div className="p-4 bg-card border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Brain className="mr-2 h-5 w-5 text-primary" />Technical Skills</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Programming Languages:</strong> Java, SQL, JavaScript</li>
                    <li><strong>Web Technologies:</strong> HTML, CSS, Firebase</li>
                    <li><strong>Project Management:</strong> Jira</li>
                    <li><strong>Development Environments & IDEs:</strong> Visual Studio</li>
                    <li><strong>Version Control:</strong> GitHub</li>
                    <li><strong>API Testing Tools:</strong> Postman</li>
                    <li><strong>Methodologies:</strong> Agile</li>
                    <li><strong>This Project (ExamPrep):</strong> Next.js (App Router), React, TypeScript, Genkit (Google Gemini AI), Tailwind CSS, ShadCN UI, Server Actions, pdfjs-dist, tesseract.js</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-card border rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Internships</h3>
                <div className="mb-3">
                  <h4 className="font-medium">Cybersecurity Intern</h4>
                  <p className="text-xs text-muted-foreground">Palo Alto Networks | Jul 2024 – Sep 2024</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-1 pl-4">
                    <li>Enhanced security knowledge by completing specialized training on basic networking and security features, improving overall understanding of cybersecurity principles.</li>
                    <li>Applied security measures based on AICTE-program modules, ensuring system integrity and reducing vulnerabilities by 25%.</li>
                    <li>Collaborated with teams to assess and resolve network security risks, contributing to a 15% increase in system uptime.</li>
                    <li>Developed practical cybersecurity skills using Palo Alto Networks tools, gaining proficiency in firewall configurations and threat analysis.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-card border rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Code className="mr-2 h-5 w-5 text-primary" />Projects</h3>
                <div className="mb-4">
                  <h4 className="font-medium">ExamPrep: AI-Powered Exam Simulator (This Project)</h4>
                  <p className="text-xs text-muted-foreground">Current Project</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-1 pl-4">
                    <li>Developed a Next.js application to transform PDF exam papers into interactive practice tests using AI.</li>
                    <li>Integrated Genkit with Google Gemini AI for intelligent extraction of exam metadata (subjects, sections, timing, marks) and individual questions from PDF text content.</li>
                    <li>Implemented client-side PDF parsing using `pdfjs-dist` with a `tesseract.js` OCR fallback for image-based or low-text PDFs.</li>
                    <li>Designed a dynamic test interface with section-wise question loading, a countdown timer, a smart pause feature, and an AI-powered hint system with progressive hints and score adjustments.</li>
                    <li>Built a comprehensive results dashboard displaying overall performance and section-wise breakdowns, calculated based on marks.</li>
                    <li>Utilized React Context API for global state management, ShadCN UI and Tailwind CSS for a responsive and modern user interface with dark mode support.</li>
                  </ul>
                </div>
                <div className="mb-4"> {/* Added mb-4 for spacing */}
                  <h4 className="font-medium">Secure and Ethical Monitoring System for Keystroke and User Behavior</h4>
                  <p className="text-xs text-muted-foreground">Dec 2024 – Jan 2024</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-1 pl-4">
                    <li>Implemented keystroke logging with active window tracking, achieving accuracy in capturing contextual user input and timestamped logs.</li>
                    <li>Monitored clipboard activity, detecting and recording changes with a 15% improvement in data capture efficiency through real-time updates.</li>
                    <li>Configured periodic screenshot capture triggered by specific events, optimizing data visibility while maintaining system resource efficiency.</li>
                    <li>Automated email reporting for keylogging data and screenshots, reducing manual reporting efforts by 30% and ensuring consistent periodic delivery.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Debug Mental Health</h4>
                  <p className="text-xs text-muted-foreground">Feb 2024 – Mar 2024</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-1 pl-4">
                    <li>Established a mental health platform using React, JavaScript, HTML, CSS, and Firebase, achieving increased user engagement during CodeFury 6.0 Hackathon.</li>
                    <li>Integrated external APIs (Quotable, Spotify), streamlining content delivery and reducing API call latency by 15%.</li>
                    <li>Engineered user authentication and journal creation features, enhancing secure registrations and user interaction.</li>
                    <li>Deployed calming games and curated resources, elevating relaxation activity accessibility by 25%.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-card border rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center"><Award className="mr-2 h-5 w-5 text-primary" />Certifications & Trainings</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Certified in IBM Data Science – Coursera.</li>
                  <li>Gained expertise in Google Data Analytics – Coursera.</li>
                  <li>Attained certification in Google Cybersecurity – Coursera.</li>
                </ul>
              </div>
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

    