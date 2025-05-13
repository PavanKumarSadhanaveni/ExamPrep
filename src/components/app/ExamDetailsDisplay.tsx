"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useExamContext } from '@/hooks/useExamContext';
// import { generateMockQuestions } from '@/lib/questionUtils'; // No longer primary source for questions
import { AlertCircle, PlayCircle, Save, Upload, ListChecks, AlertTriangleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ExtractExamInfoOutput } from '@/ai/flows/extract-exam-info';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import LoadingDots from './LoadingDots';


const ExamDetailsDisplay: React.FC = () => {
  const router = useRouter();
  const { examData, setExamInfo, startExam, isLoading: contextIsLoading } = useExamContext();
  const { toast } = useToast();

  const [editableInfo, setEditableInfo] = useState<ExtractExamInfoOutput | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);


  useEffect(() => {
    setIsPageLoading(true);
    if (examData.examInfo) {
      setEditableInfo(JSON.parse(JSON.stringify(examData.examInfo)));
      setHasUnsavedChanges(false);
    } else if (!contextIsLoading) { // If context isn't loading and no examInfo, redirect
      // This situation implies the user landed here without uploading a PDF
      // or the data was lost and not restored from localStorage.
      toast({
        title: "Missing Exam Data",
        description: "No exam information found. Please upload a PDF first.",
        variant: "destructive",
      });
      router.replace('/');
      return; // Stop further processing
    }
    setIsPageLoading(false);
  }, [examData.examInfo, contextIsLoading, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableInfo(prev => {
      if (!prev) return null;
      const fieldName = name as keyof ExtractExamInfoOutput;
      
      let processedValue: string | number | string[] | undefined = value;

      if (fieldName === 'totalMarks' || fieldName === 'numberOfQuestions' || fieldName === 'marksPerQuestion') {
        processedValue = value === '' ? undefined : parseFloat(value);
        if (isNaN(processedValue as number)) {
            processedValue = undefined;
        }
      } else if (fieldName === 'sections') {
        processedValue = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      
      setHasUnsavedChanges(true);
      return { ...prev, [fieldName]: processedValue };
    });
  };

  const handleSaveChanges = () => {
    if (editableInfo) {
      if (!editableInfo.examName?.trim() || !editableInfo.duration?.trim()) {
        toast({
          title: "Missing Information",
          description: "Exam Name and Duration are required.",
          variant: "destructive",
        });
        return;
      }
       // numberOfQuestions is now primarily informational if AI extracts questions.
      // Validation might be less strict or adjusted based on AI's output.
      if (editableInfo.numberOfQuestions !== undefined && editableInfo.numberOfQuestions !== null && editableInfo.numberOfQuestions <= 0) {
         toast({
          title: "Invalid Information",
          description: "Total Number of Questions, if specified, must be a positive number.",
          variant: "destructive",
        });
        return;
      }
      if (editableInfo.totalMarks !== undefined && editableInfo.totalMarks !== null && editableInfo.totalMarks < 0) {
         toast({
          title: "Invalid Information",
          description: "Total Marks cannot be negative.",
          variant: "destructive",
        });
        return;
      }
      if (editableInfo.marksPerQuestion !== undefined && editableInfo.marksPerQuestion !== null && editableInfo.marksPerQuestion < 0) {
         toast({
          title: "Invalid Information",
          description: "Marks Per Question cannot be negative.",
          variant: "destructive",
        });
        return;
      }

      setExamInfo(editableInfo);
      setHasUnsavedChanges(false);
      toast({
        title: "Details Saved",
        description: "Exam details have been successfully updated.",
        variant: "default"
      });
    }
  };

  const handleStartExam = () => {
    if (hasUnsavedChanges) {
      toast({
        title: "Unsaved Changes",
        description: "Please save your changes before starting the exam.",
        variant: "default",
      });
      return;
    }

    if (!examData.examInfo) {
      toast({
        title: "Error",
        description: "Exam details not available. Please save valid details first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!examData.questions || examData.questions.length === 0) {
        toast({
            title: "No Questions Available",
            description: "Questions could not be loaded or extracted for this exam. Cannot start.",
            variant: "destructive",
        });
        return;
    }

    startExam(); // This now relies on questions already being in context
    router.push('/exam/test');
  };
  
  if (isPageLoading || contextIsLoading) {
    return <LoadingDots text="Loading exam details..." />;
  }


  if (!editableInfo) { // Should be caught by useEffect redirect, but as a fallback
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
          <Button onClick={() => router.push('/')} variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Upload New PDF
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const { sections } = editableInfo;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">
          {editableInfo.examName || "Exam Details"}
        </CardTitle>
        <CardDescription>
          Review and edit the extracted exam information. AI-extracted questions: {examData.questions.length}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {examData.questions.length === 0 && (
            <div className="p-3 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-700 text-sm flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
                <p>Warning: No questions were extracted or loaded for this exam. Starting the exam may not be possible or may use placeholder content if configured.</p>
            </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Field</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell><Label htmlFor="examName">Exam Name*</Label></TableCell>
              <TableCell>
                <Input id="examName" name="examName" value={editableInfo.examName || ""} onChange={handleChange} placeholder="e.g., Final Physics Exam" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="duration">Duration*</Label></TableCell>
              <TableCell>
                <Input id="duration" name="duration" value={editableInfo.duration || ""} onChange={handleChange} placeholder="e.g., 2 hours, 90 minutes" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="totalMarks">Total Marks</Label></TableCell>
              <TableCell>
                <Input id="totalMarks" name="totalMarks" type="number" value={editableInfo.totalMarks ?? ""} onChange={handleChange} placeholder="e.g., 100" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="numberOfQuestions">Total Number of Questions (AI Extracted: {examData.questions.length > 0 ? examData.questions.length : (editableInfo.numberOfQuestions || 'N/A')})</Label></TableCell>
              <TableCell>
                <Input id="numberOfQuestions" name="numberOfQuestions" type="number" value={editableInfo.numberOfQuestions ?? ""} onChange={handleChange} placeholder="e.g., 50" />
                 <p className="text-xs text-muted-foreground mt-1">AI extracted {examData.questions.length} questions. This field can be edited for reference.</p>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="marksPerQuestion">Marks Per Question</Label></TableCell>
              <TableCell>
                <Input id="marksPerQuestion" name="marksPerQuestion" type="number" value={editableInfo.marksPerQuestion ?? ""} onChange={handleChange} placeholder="e.g., 1 or varies" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="negativeMarking">Negative Marking</Label></TableCell>
              <TableCell>
                <Input id="negativeMarking" name="negativeMarking" value={editableInfo.negativeMarking || ""} onChange={handleChange} placeholder="e.g., Yes, 0.25 per wrong answer or No" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Separator />

        <div>
          <Label className="text-lg font-semibold flex items-center gap-2"><ListChecks /> Sections</Label>
          {sections && sections.length > 0 ? (
            <ul className="mt-2 list-disc list-inside pl-4 space-y-1 bg-secondary/30 p-3 rounded-md">
              {sections.map((section, index) => (
                <li key={index} className="text-foreground">{section}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted-foreground bg-secondary/30 p-3 rounded-md">
              No sections were explicitly identified by the AI. 
              You can describe section details in the 'Question Breakdown' below if needed.
              If sections are critical, ensure your PDF clearly defines them.
            </p>
          )}
        </div>
        
        <Separator />

        <div>
          <Label htmlFor="questionBreakdown" className="text-lg font-semibold">Question Breakdown</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Edit the summary of question distribution, marks per section, or any specific instructions. 
            This information helps in understanding the exam structure.
          </p>
          <Textarea 
            id="questionBreakdown"
            name="questionBreakdown" 
            value={editableInfo.questionBreakdown || ""} 
            onChange={handleChange}
            placeholder="e.g., Section A: 20 questions, 1 mark each. Section B: 10 questions, 2 marks each. No negative marking in Section A."
            rows={5}
            className="bg-secondary/30"
          />
        </div>
        
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
        <Button variant="outline" onClick={() => router.push('/')} className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" /> Upload Different PDF
        </Button>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={handleSaveChanges} variant="secondary" className="w-full sm:w-auto" disabled={!hasUnsavedChanges}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
          <Button 
            onClick={handleStartExam} 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            disabled={examData.questions.length === 0}
          >
            <PlayCircle className="mr-2 h-5 w-5" /> Start Exam ({examData.questions.length} Qs)
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExamDetailsDisplay;
