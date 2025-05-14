
"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Import React
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useExamContext } from '@/hooks/useExamContext';
import { AlertCircle, PlayCircle, Save, Upload, ListChecks, AlertTriangleIcon, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ExtractExamInfoOutput, SubjectDetail, SectionDetail } from '@/ai/flows/extract-exam-info';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import LoadingDots from './LoadingDots';


const ExamDetailsDisplay: React.FC = () => {
  const router = useRouter();
  const { 
    examData, 
    setExamInfo: contextSetExamInfo,
    startExam: contextStartExam, 
    isLoading: contextIsLoading, 
    sectionsExtracted,
    sectionBeingExtracted,
    extractQuestionsForSection 
  } = useExamContext();
  const { toast } = useToast();

  const [editableInfo, setEditableInfo] = useState<ExtractExamInfoOutput | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const firstFlatSectionIdentifier = editableInfo?.sections?.[0] || null;
  const areFirstSectionQuestionsLoaded = firstFlatSectionIdentifier ? sectionsExtracted.includes(firstFlatSectionIdentifier) : false;
  const isFirstSectionCurrentlyLoading = firstFlatSectionIdentifier === sectionBeingExtracted;


  useEffect(() => {
    setIsPageLoading(true); 
  
    if (examData.examInfo) {
      const currentExamInfoSnapshot: ExtractExamInfoOutput = JSON.parse(JSON.stringify(examData.examInfo));
      setEditableInfo(currentExamInfoSnapshot);
  
      const noValidSubjectsOrSections = (!currentExamInfoSnapshot.subjects || currentExamInfoSnapshot.subjects.length === 0 || currentExamInfoSnapshot.subjects.every(s => !s.subjectSections || s.subjectSections.length === 0)) && 
                                        (!currentExamInfoSnapshot.sections || currentExamInfoSnapshot.sections.length === 0);
      const noTotalQuestions = currentExamInfoSnapshot.overallNumberOfQuestions === undefined || currentExamInfoSnapshot.overallNumberOfQuestions === null || currentExamInfoSnapshot.overallNumberOfQuestions === 0;
  
      if (noValidSubjectsOrSections && noTotalQuestions) {
        toast({
          title: "AI Analysis Incomplete",
          description: "Key exam details (subjects, sections, or total questions) are missing. Redirecting to suggestions page.",
          variant: "default",
          duration: 6000, 
        });
        router.replace('/exam/suggestions');
        return; 
      }
      
      setHasUnsavedChanges(false);
      setIsPageLoading(false);
  
    } else if (!contextIsLoading) { 
      toast({
        title: "Missing Exam Data",
        description: "No exam information found. Please upload a PDF first.",
        variant: "destructive",
      });
      router.replace('/upload'); // Changed from '/' to '/upload'
    }
  }, [examData.examInfo, contextIsLoading, router, toast]);
  

  useEffect(() => {
    if (editableInfo && firstFlatSectionIdentifier && !areFirstSectionQuestionsLoaded && !isFirstSectionCurrentlyLoading && !contextIsLoading && examData.pdfTextContent) {
      extractQuestionsForSection(firstFlatSectionIdentifier);
    }
  }, [editableInfo, firstFlatSectionIdentifier, areFirstSectionQuestionsLoaded, isFirstSectionCurrentlyLoading, extractQuestionsForSection, contextIsLoading, examData.pdfTextContent]);


  const handleGlobalChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableInfo(prev => {
      if (!prev) return null;
      const fieldName = name as keyof ExtractExamInfoOutput;
      
      let processedValue: string | number | undefined = value;
      if (fieldName === 'overallTotalMarks' || fieldName === 'overallNumberOfQuestions') {
        processedValue = value === '' ? undefined : parseFloat(value);
        if (isNaN(processedValue as number)) processedValue = undefined;
      }
      
      setHasUnsavedChanges(true);
      return { ...prev, [fieldName]: processedValue };
    });
  }, []);
  
  const handleSaveChanges = useCallback(() => {
    if (editableInfo) {
      if (!editableInfo.examName?.trim() || !editableInfo.overallDuration?.trim()) {
        toast({ title: "Missing Information", description: "Exam Name and Overall Duration are required.", variant: "destructive" });
        return;
      }
      contextSetExamInfo(editableInfo);
      setHasUnsavedChanges(false);
      toast({ title: "Details Saved", description: "Exam details have been successfully updated.", variant: "default" });
    }
  }, [editableInfo, contextSetExamInfo, toast]);

  const handleStartExam = useCallback(() => {
    if (hasUnsavedChanges) {
      toast({ title: "Unsaved Changes", description: "Please save your changes before starting the exam.", variant: "default" });
      return;
    }
    if (!editableInfo) {
      toast({ title: "Error", description: "Exam details not available.", variant: "destructive" });
      return;
    }
    
    if (!firstFlatSectionIdentifier || !areFirstSectionQuestionsLoaded) {
      toast({
        title: "First Section Not Ready",
        description: `Questions for the first section part (${firstFlatSectionIdentifier || 'N/A'}) are not loaded yet. Please wait or try reloading.`,
        variant: "destructive",
      });
      if (firstFlatSectionIdentifier && !isFirstSectionCurrentlyLoading && examData.pdfTextContent) {
        extractQuestionsForSection(firstFlatSectionIdentifier); 
      }
      return;
    }
    const questionsForFirstLogicalSection = examData.questions.filter(q => q.section === firstFlatSectionIdentifier).length;

    if (questionsForFirstLogicalSection === 0 && areFirstSectionQuestionsLoaded) {
      toast({
        title: "No Questions in First Section",
        description: `AI found no questions for the first part (${firstFlatSectionIdentifier}). Cannot start exam. Try uploading a different PDF or check PDF content.`,
        variant: "destructive",
      });
      return;
    }

    contextStartExam(); 
    router.push('/exam/test');
  }, [hasUnsavedChanges, editableInfo, firstFlatSectionIdentifier, areFirstSectionQuestionsLoaded, isFirstSectionCurrentlyLoading, examData.pdfTextContent, examData.questions, extractQuestionsForSection, contextStartExam, router, toast]);
  
  if (isPageLoading || (contextIsLoading && !editableInfo)) { 
    return <LoadingDots text="Loading exam details..." />;
  }

  if (!editableInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle /> No Exam Information</CardTitle></CardHeader>
        <CardContent><p>Exam information could not be loaded. Please try uploading the PDF again.</p></CardContent>
        <CardFooter><Button onClick={() => router.push('/upload')} variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload New PDF</Button></CardFooter> 
      </Card>
    );
  }

  const questionsForFirstSectionCount = examData.questions.filter(q => q.section === firstFlatSectionIdentifier).length;
  const startButtonDisabled = isFirstSectionCurrentlyLoading || !areFirstSectionQuestionsLoaded || (areFirstSectionQuestionsLoaded && questionsForFirstSectionCount === 0);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">
          {editableInfo.examName || "Exam Details"}
        </CardTitle>
        <CardDescription>
          Review and edit the extracted exam information. 
          {firstFlatSectionIdentifier ? 
            (isFirstSectionCurrentlyLoading ? `Loading questions for ${firstFlatSectionIdentifier}...` : 
            (areFirstSectionQuestionsLoaded ? `${questionsForFirstSectionCount} questions loaded for ${firstFlatSectionIdentifier}.` : `First section part (${firstFlatSectionIdentifier}) questions not loaded yet.`))
            : "No sections identified for question extraction."}
           Total questions expected: {editableInfo.overallNumberOfQuestions ?? 'N/A'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!areFirstSectionQuestionsLoaded && firstFlatSectionIdentifier && (
            <div className="p-3 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 text-sm flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p>
                  {isFirstSectionCurrentlyLoading 
                    ? <span className='flex items-center gap-1'><Loader2 className="h-4 w-4 animate-spin" /> Loading questions for: {firstFlatSectionIdentifier}...</span>
                    : `Questions for ${firstFlatSectionIdentifier} are not yet loaded. They will be loaded automatically.`
                  }
                </p>
            </div>
        )}
         {areFirstSectionQuestionsLoaded && questionsForFirstSectionCount === 0 && firstFlatSectionIdentifier && (
             <div className="p-3 rounded-md bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700 text-sm flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p>Warning: No questions were extracted for {firstFlatSectionIdentifier}. You may not be able to start the exam if this is the first part.</p>
            </div>
         )}

        <h2 className="text-xl font-semibold text-foreground mt-4 border-b pb-2">Overall Exam Details</h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium w-[250px]"><Label htmlFor="examName">Exam Name*</Label></TableCell>
              <TableCell><Input id="examName" name="examName" value={editableInfo.examName || ""} onChange={handleGlobalChange} placeholder="e.g., Final Physics Exam" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium"><Label htmlFor="overallDuration">Overall Duration*</Label></TableCell>
              <TableCell><Input id="overallDuration" name="overallDuration" value={editableInfo.overallDuration || ""} onChange={handleGlobalChange} placeholder="e.g., 2 hours, 90 minutes" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium"><Label htmlFor="overallTotalMarks">Overall Total Marks</Label></TableCell>
              <TableCell><Input id="overallTotalMarks" name="overallTotalMarks" type="number" value={editableInfo.overallTotalMarks ?? ""} onChange={handleGlobalChange} placeholder="e.g., 100" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium"><Label htmlFor="overallNumberOfQuestions">Overall Expected Questions</Label></TableCell>
              <TableCell><Input id="overallNumberOfQuestions" name="overallNumberOfQuestions" type="number" value={editableInfo.overallNumberOfQuestions ?? ""} onChange={handleGlobalChange} placeholder="e.g., 50" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium"><Label htmlFor="overallNegativeMarking">Overall Negative Marking</Label></TableCell>
              <TableCell><Input id="overallNegativeMarking" name="overallNegativeMarking" value={editableInfo.overallNegativeMarking || ""} onChange={handleGlobalChange} placeholder="e.g., Yes, 0.25 per wrong answer or No" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Separator />

        <div>
          <Label className="text-xl font-semibold flex items-center gap-2"><ListChecks /> Subjects & Sections</Label>
          {Array.isArray(editableInfo?.subjects) && editableInfo.subjects.length > 0 ? (
            <Accordion type="multiple" className="w-full mt-2" defaultValue={editableInfo.subjects.map(s => `subject-${s.subjectName}`)}>
              {editableInfo.subjects.map((subject, subjectIndex) => (
                <AccordionItem value={`subject-${subject.subjectName}`} key={`subject-${subjectIndex}`}>
                  <AccordionTrigger className="text-lg font-medium bg-secondary/20 hover:bg-secondary/30 px-4 py-3 rounded-md">
                    {subject.subjectName} 
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                       ({subject.numberOfQuestionsInSubject ?? 'N/A'} Qs, {subject.totalMarksForSubject ?? 'N/A'} Marks, {subject.subjectDuration || 'N/A time'})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-2 px-2">
                    {Array.isArray(subject.subjectSections) && subject.subjectSections.length > 0 ? (
                      <div className="space-y-3 p-3 bg-background rounded-b-md border border-t-0">
                        {subject.subjectSections.map((section, sectionIndex) => {
                          const flatSectionId = editableInfo.sections?.find(s => s.includes(subject.subjectName) && s.includes(section.sectionNameOrType)) || `${subject.subjectName} - ${section.sectionNameOrType}`;
                          const isLoadingThisFlatSection = sectionBeingExtracted === flatSectionId;
                          const isThisFlatSectionExtracted = sectionsExtracted.includes(flatSectionId);
                          const questionsInThisFlatSection = examData.questions.filter(q => q.section === flatSectionId).length;

                          return (
                            <Card key={`section-${subjectIndex}-${sectionIndex}`} className="shadow-sm">
                              <CardHeader className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-t-md">
                                <CardTitle className="text-md font-semibold">{section.sectionNameOrType}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 text-sm space-y-1">
                                <p>Expected Questions: {section.numberOfQuestions ?? 'N/A'}</p>
                                <p>Marks per Question: {section.marksPerQuestion ?? 'N/A'}</p>
                                <p>Total Marks for Section: {section.totalMarksForSection ?? 'N/A'}</p>
                                <div className="mt-2 text-xs">
                                  {isLoadingThisFlatSection && <span className="flex items-center text-blue-600 dark:text-blue-400"><Loader2 className="h-3 w-3 inline animate-spin mr-1" /> Loading questions...</span>}
                                  {isThisFlatSectionExtracted && !isLoadingThisFlatSection && (
                                    questionsInThisFlatSection > 0 
                                    ? <span className="text-green-600 dark:text-green-400">({questionsInThisFlatSection} questions loaded)</span>
                                    : <span className="text-red-500 dark:text-red-400">(No questions found/loaded)</span>
                                  )}
                                  {!isThisFlatSectionExtracted && !isLoadingThisFlatSection && <span className="text-gray-500 dark:text-gray-400">(Question extraction pending)</span>}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="p-3 text-muted-foreground">No sections detailed for this subject.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="mt-2 text-muted-foreground bg-secondary/30 p-3 rounded-md">
              No subjects structured by AI. Check "Flat Sections for Extraction" below or <Link href="/exam/suggestions" className="text-primary hover:underline">see suggestions</Link> if exam data seems incorrect.
            </p>
          )}
        </div>
        <Separator />

        <div>
            <Label className="text-lg font-semibold flex items-center gap-2"><Info size={20}/> Flat Sections for Extraction</Label>
            <p className="text-xs text-muted-foreground mb-1">This is the list of identifiers the app will use to load questions for each part.</p>
            {Array.isArray(editableInfo?.sections) && editableInfo.sections.length > 0 ? (
                 <ul className="mt-1 list-disc list-inside pl-4 space-y-1 bg-secondary/30 p-3 rounded-md text-sm">
                    {editableInfo.sections.map((flatSectionId, index) => (
                        <li key={`flat-${index}`}>
                            {flatSectionId}
                            {sectionBeingExtracted === flatSectionId && <Loader2 className="h-4 w-4 inline animate-spin ml-2 text-blue-500 dark:text-blue-400" />}
                            {sectionsExtracted.includes(flatSectionId) && examData.questions.filter(q => q.section === flatSectionId).length === 0 && !sectionBeingExtracted && <span className="text-xs text-red-500 dark:text-red-400 ml-1">(No questions found)</span>}
                            {sectionsExtracted.includes(flatSectionId) && examData.questions.filter(q => q.section === flatSectionId).length > 0 && !sectionBeingExtracted && <span className="text-xs text-green-600 dark:text-green-400 ml-1">({examData.questions.filter(q => q.section === flatSectionId).length} Qs loaded)</span>}
                            {!sectionsExtracted.includes(flatSectionId) && sectionBeingExtracted !== flatSectionId && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Pending)</span>}
                        </li>
                    ))}
                 </ul>
            ) : (
                <p className="mt-1 text-muted-foreground bg-secondary/30 p-3 rounded-md">No flat sections list generated. Question extraction might fail.</p>
            )}
        </div>
        <Separator/>

        <div>
          <Label htmlFor="questionBreakdown" className="text-lg font-semibold">AI's General Question Breakdown Summary</Label>
          <Textarea id="questionBreakdown" name="questionBreakdown" value={editableInfo.questionBreakdown || "Not specified by AI."} onChange={handleGlobalChange} placeholder="e.g., Section A: 20 questions..." rows={3} className="bg-secondary/30"/>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
        <Button variant="outline" onClick={() => router.push('/upload')} className="w-full sm:w-auto"><Upload className="mr-2 h-4 w-4" /> Upload Different PDF</Button>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={handleSaveChanges} variant="secondary" className="w-full sm:w-auto" disabled={!hasUnsavedChanges || !editableInfo || contextIsLoading}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
          <Button onClick={handleStartExam} className="w-full sm:w-auto bg-primary hover:bg-primary/90" disabled={startButtonDisabled || !editableInfo || contextIsLoading}>
            {isFirstSectionCurrentlyLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            {isFirstSectionCurrentlyLoading ? "Loading..." : (areFirstSectionQuestionsLoaded && questionsForFirstSectionCount > 0 ? `Start Exam (${questionsForFirstSectionCount} Qs)` : "Start Exam")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExamDetailsDisplay;
