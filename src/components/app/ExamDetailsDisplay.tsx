"use client";

import type React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useExamContext } from '@/hooks/useExamContext';
import { generateMockQuestions } from '@/lib/questionUtils';
import { BookText, Clock, ListChecks, Hash, AlertCircle, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ExamDetailsDisplay: React.FC = () => {
  const router = useRouter();
  const { examData, setQuestions, startExam } = useExamContext();
  const { toast } = useToast();

  if (!examData.examInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle /> No Exam Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Exam information could not be loaded. Please try uploading the PDF again.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push('/')} variant="outline">Upload New PDF</Button>
        </CardFooter>
      </Card>
    );
  }

  const { examName, duration, sections, questionBreakdown, totalMarks, numberOfQuestions, marksPerQuestion, negativeMarking } = examData.examInfo;

  const handleStartExam = () => {
    const questions = generateMockQuestions(examData.examInfo);
    if (questions.length === 0) {
        toast({
            title: "No Questions Generated",
            description: "Could not generate questions for this exam. Please check the PDF or try again.",
            variant: "destructive",
        });
        return;
    }
    setQuestions(questions);
    startExam();
    router.push('/exam/test');
  };

  const DetailItem: React.FC<{icon: React.ElementType, label: string, value?: string | number | string[]}> = ({ icon: Icon, label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Array.isArray(value) ? (
            <ul className="list-disc list-inside">
              {value.map((item, index) => <li key={index} className="text-foreground">{item}</li>)}
            </ul>
          ) : (
            <p className="text-lg font-semibold text-foreground">{value.toString()}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">{examName || "Exam Details"}</CardTitle>
        <CardDescription>Review the extracted exam information below before starting your practice session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <DetailItem icon={BookText} label="Exam Name" value={examName} />
        <DetailItem icon={Clock} label="Duration" value={duration} />
        
        {sections && sections.length > 0 && (
            <DetailItem icon={ListChecks} label="Sections" value={sections} />
        )}
        
        <Separator />
        
        <DetailItem icon={Hash} label="Total Questions" value={numberOfQuestions} />
        <DetailItem icon={Hash} label="Total Marks" value={totalMarks} />
        <DetailItem icon={Hash} label="Marks Per Question" value={marksPerQuestion} />
        <DetailItem icon={AlertCircle} label="Negative Marking" value={negativeMarking} />

        {questionBreakdown && (
             <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Question Breakdown</p>
                <p className="text-foreground bg-secondary/50 p-3 rounded-md whitespace-pre-wrap">{questionBreakdown}</p>
            </div>
        )}
        
      </CardContent>
      <CardFooter className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => router.push('/')}>Upload Different PDF</Button>
        <Button onClick={handleStartExam} className="bg-primary hover:bg-primary/90">
          <PlayCircle className="mr-2 h-5 w-5" />
          Start Exam
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExamDetailsDisplay;
