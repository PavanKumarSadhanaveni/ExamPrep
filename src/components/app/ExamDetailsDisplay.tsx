"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useExamContext } from '@/hooks/useExamContext';
import { AlertCircle, PlayCircle, Save, Upload, ListChecks, AlertTriangleIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ExtractExamInfoOutput } from '@/ai/flows/extract-exam-info';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import LoadingDots from './LoadingDots';


const ExamDetailsDisplay: React.FC = () => {
  const router = useRouter();
  const { 
    examData, 
    setExamInfo: contextSetExamInfo, // Renamed to avoid conflict with local state setter
    startExam, 
    isLoading: contextIsLoading, 
    sectionsExtracted, 
    sectionBeingExtracted,
    extractQuestionsForSection 
  } = useExamContext();
  const { toast } = useToast();

  const [editableInfo, setEditableInfo] = useState<ExtractExamInfoOutput | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const firstSectionName = examData.examInfo?.sections?.[0] || null;
  const areFirstSectionQuestionsLoaded = firstSectionName ? sectionsExtracted.includes(firstSectionName) : false;
  const isFirstSectionCurrentlyLoading = firstSectionName === sectionBeingExtracted;


  useEffect(() => {
    setIsPageLoading(true);
    if (examData.examInfo) {
      setEditableInfo(JSON.parse(JSON.stringify(examData.examInfo)));
      setHasUnsavedChanges(false);
    } else if (!contextIsLoading) { 
      toast({
        title: "Missing Exam Data",
        description: "No exam information found. Please upload a PDF first.",
        variant: "destructive",
      });
      router.replace('/');
      return; 
    }
    setIsPageLoading(false);
  }, [examData.examInfo, contextIsLoading, router, toast]);

  // Attempt to load first section if not already loaded/loading
  useEffect(() => {
    if (firstSectionName && !areFirstSectionQuestionsLoaded && !isFirstSectionCurrentlyLoading && !contextIsLoading && examData.pdfTextContent) {
      extractQuestionsForSection(firstSectionName);
    }
  }, [firstSectionName, areFirstSectionQuestionsLoaded, isFirstSectionCurrentlyLoading, extractQuestionsForSection, contextIsLoading, examData.pdfTextContent]);


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
        // Modifying sections array directly if needed. For now, it's display-only mostly from AI.
        // If sections are user-editable, this logic needs to update context carefully.
        // For now, let's assume sections derived by AI are the source of truth for section names.
        // This input might be better as a Textarea for comma-separated values if editable.
        // For simplicity, we are not making sections editable here.
      }
      
      setHasUnsavedChanges(true);
      return { ...prev, [fieldName]: processedValue };
    });
  };

  const handleSaveChanges = () => {
    if (editableInfo) {
      // Basic Validations
      if (!editableInfo.examName?.trim() || !editableInfo.duration?.trim()) {
        toast({ title: "Missing Information", description: "Exam Name and Duration are required.", variant: "destructive" });
        return;
      }
      // More specific validations
      contextSetExamInfo(editableInfo); // Use the renamed context function
      setHasUnsavedChanges(false);
      toast({ title: "Details Saved", description: "Exam details have been successfully updated.", variant: "default" });
    }
  };

  const handleStartExam = () => {
    if (hasUnsavedChanges) {
      toast({ title: "Unsaved Changes", description: "Please save your changes before starting the exam.", variant: "default" });
      return;
    }
    if (!examData.examInfo) {
      toast({ title: "Error", description: "Exam details not available.", variant: "destructive" });
      return;
    }
    if (!firstSectionName || !areFirstSectionQuestionsLoaded) {
      toast({
        title: "First Section Not Ready",
        description: `Questions for the first section (${firstSectionName || 'N/A'}) are not loaded yet. Please wait or try reloading.`,
        variant: "destructive",
      });
      if (firstSectionName && !isFirstSectionCurrentlyLoading && examData.pdfTextContent) {
        extractQuestionsForSection(firstSectionName); // Attempt to load again
      }
      return;
    }
    if (examData.questions.filter(q => q.section === firstSectionName).length === 0 && areFirstSectionQuestionsLoaded) {
      toast({
        title: "No Questions in First Section",
        description: `AI found no questions for the first section (${firstSectionName}). Cannot start exam. Try uploading a different PDF or check PDF content.`,
        variant: "destructive",
      });
      return;
    }

    startExam(); 
    router.push('/exam/test');
  };
  
  if (isPageLoading || contextIsLoading && !examData.examInfo) { // Show main loading if examInfo isn't even there yet.
    return <LoadingDots text="Loading exam details..." />;
  }

  if (!editableInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle /> No Exam Information</CardTitle></CardHeader>
        <CardContent><p>Exam information could not be loaded. Please try uploading the PDF again.</p></CardContent>
        <CardFooter><Button onClick={() => router.push('/')} variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload New PDF</Button></CardFooter>
      </Card>
    );
  }

  const questionsForFirstSectionCount = examData.questions.filter(q => q.section === firstSectionName).length;
  const startButtonDisabled = isFirstSectionCurrentlyLoading || !areFirstSectionQuestionsLoaded || (areFirstSectionQuestionsLoaded && questionsForFirstSectionCount === 0);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">
          {editableInfo.examName || "Exam Details"}
        </CardTitle>
        <CardDescription>
          Review and edit the extracted exam information. 
          {firstSectionName ? 
            (isFirstSectionCurrentlyLoading ? `Loading questions for ${firstSectionName}...` : 
            (areFirstSectionQuestionsLoaded ? `${questionsForFirstSectionCount} questions loaded for ${firstSectionName}.` : `First section (${firstSectionName}) questions not loaded yet.`))
            : "No sections identified."}
           Total questions expected: {editableInfo.numberOfQuestions || 'N/A'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!areFirstSectionQuestionsLoaded && firstSectionName && (
            <div className="p-3 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-700 text-sm flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
                <p>
                  {isFirstSectionCurrentlyLoading 
                    ? <span className='flex items-center gap-1'><Loader2 className="h-4 w-4 animate-spin" /> Loading questions for the first section: {firstSectionName}...</span>
                    : `Questions for the first section (${firstSectionName}) are not yet loaded. They will be loaded automatically or when you start the exam.`
                  }
                </p>
            </div>
        )}
         {areFirstSectionQuestionsLoaded && questionsForFirstSectionCount === 0 && firstSectionName && (
             <div className="p-3 rounded-md bg-red-100 border border-red-300 text-red-700 text-sm flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                <p>Warning: No questions were extracted for the first section ({firstSectionName}). You may not be able to start the exam.</p>
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
            {/* Fields: Exam Name, Duration, Total Marks, Total Number of Qs, Marks Per Q, Negative Marking */}
            <TableRow>
              <TableCell><Label htmlFor="examName">Exam Name*</Label></TableCell>
              <TableCell><Input id="examName" name="examName" value={editableInfo.examName || ""} onChange={handleChange} placeholder="e.g., Final Physics Exam" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="duration">Duration*</Label></TableCell>
              <TableCell><Input id="duration" name="duration" value={editableInfo.duration || ""} onChange={handleChange} placeholder="e.g., 2 hours, 90 minutes" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="totalMarks">Total Marks</Label></TableCell>
              <TableCell><Input id="totalMarks" name="totalMarks" type="number" value={editableInfo.totalMarks ?? ""} onChange={handleChange} placeholder="e.g., 100" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="numberOfQuestions">Total Expected Questions</Label></TableCell>
              <TableCell><Input id="numberOfQuestions" name="numberOfQuestions" type="number" value={editableInfo.numberOfQuestions ?? ""} onChange={handleChange} placeholder="e.g., 50" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="marksPerQuestion">Marks Per Question</Label></TableCell>
              <TableCell><Input id="marksPerQuestion" name="marksPerQuestion" type="number" value={editableInfo.marksPerQuestion ?? ""} onChange={handleChange} placeholder="e.g., 1 or varies" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell><Label htmlFor="negativeMarking">Negative Marking</Label></TableCell>
              <TableCell><Input id="negativeMarking" name="negativeMarking" value={editableInfo.negativeMarking || ""} onChange={handleChange} placeholder="e.g., Yes, 0.25 per wrong answer or No" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Separator />
        <div>
          <Label className="text-lg font-semibold flex items-center gap-2"><ListChecks /> Sections</Label>
          {editableInfo.sections && editableInfo.sections.length > 0 ? (
            <ul className="mt-2 list-disc list-inside pl-4 space-y-1 bg-secondary/30 p-3 rounded-md">
              {editableInfo.sections.map((section, index) => (
                <li key={index} className="text-foreground">
                  {section}
                  {section === sectionBeingExtracted && <Loader2 className="h-4 w-4 inline animate-spin ml-2" />}
                  {sectionsExtracted.includes(section) && examData.questions.filter(q=>q.section === section).length === 0 && <span className="text-xs text-red-500 ml-1">(No questions found)</span>}
                  {sectionsExtracted.includes(section) && examData.questions.filter(q=>q.section === section).length > 0 && <span className="text-xs text-green-600 ml-1">({examData.questions.filter(q=>q.section === section).length} Qs loaded)</span>}
                  {!sectionsExtracted.includes(section) && section !== sectionBeingExtracted && <span className="text-xs text-gray-500 ml-1">(Pending)</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted-foreground bg-secondary/30 p-3 rounded-md">No sections identified by AI.</p>
          )}
        </div>
        <Separator />
        <div>
          <Label htmlFor="questionBreakdown" className="text-lg font-semibold">Question Breakdown</Label>
          <Textarea id="questionBreakdown" name="questionBreakdown" value={editableInfo.questionBreakdown || ""} onChange={handleChange} placeholder="e.g., Section A: 20 questions..." rows={3} className="bg-secondary/30"/>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
        <Button variant="outline" onClick={() => router.push('/')} className="w-full sm:w-auto"><Upload className="mr-2 h-4 w-4" /> Upload Different PDF</Button>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={handleSaveChanges} variant="secondary" className="w-full sm:w-auto" disabled={!hasUnsavedChanges}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
          <Button onClick={handleStartExam} className="w-full sm:w-auto bg-primary hover:bg-primary/90" disabled={startButtonDisabled}>
            {isFirstSectionCurrentlyLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            {isFirstSectionCurrentlyLoading ? "Loading..." : (areFirstSectionQuestionsLoaded && questionsForFirstSectionCount > 0 ? `Start Exam (${questionsForFirstSectionCount} Qs)` : "Start Exam")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExamDetailsDisplay;
