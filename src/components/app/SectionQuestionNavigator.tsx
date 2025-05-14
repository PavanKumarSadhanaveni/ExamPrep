
"use client";

import React, { useState, useEffect, useCallback }from 'react'; // Import React
import { useExamContext } from '@/hooks/useExamContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown, ChevronRight, Loader2, Menu as MenuIcon } from 'lucide-react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { SubjectDetail, SectionDetail } from '@/ai/flows/extract-exam-info';

const SectionQuestionNavigator: React.FC = () => {
  const { 
    examData, 
    navigateToQuestion: contextNavigateToQuestion, 
    navigateToSection: contextNavigateToSection,
    sectionsExtracted,
    sectionBeingExtracted,
  } = useExamContext();
  const { toast } = useToast();
  const { examInfo, questions, userAnswers, currentSection: currentFlatSectionId, startTime, isPaused, currentQuestionIndex } = examData;
  
  const [activeUIToggleSubject, setActiveUIToggleSubject] = useState<string | null>(null);

  const { state: sidebarState, isMobile, collapsibleMode, toggleSidebar } = useSidebar();
  const isIconCollapsed = !isMobile && sidebarState === 'collapsed' && collapsibleMode === 'icon';

  useEffect(() => {
    if (currentFlatSectionId && examInfo?.subjects) {
      const subjectName = examInfo.subjects.find(subj => 
        currentFlatSectionId.startsWith(subj.subjectName)
      )?.subjectName;
      if (subjectName) {
        setActiveUIToggleSubject(subjectName);
      }
    } else if (examInfo?.subjects && examInfo.subjects.length > 0 && !activeUIToggleSubject) {
      setActiveUIToggleSubject(examInfo.subjects[0].subjectName);
    }
  }, [currentFlatSectionId, examInfo?.subjects, activeUIToggleSubject]);

  const handleSubjectHeaderClick = useCallback((subjectName: string) => {
    setActiveUIToggleSubject(prev => prev === subjectName ? null : subjectName);
  }, []);

  const handleSectionButtonClick = useCallback(async (subjectName: string, sectionNameOrType: string) => {
    const flatSectionIdToNavigate = examInfo?.sections?.find(s => s.includes(subjectName) && s.includes(sectionNameOrType)) || `${subjectName} - ${sectionNameOrType}`;
    
    if (isPaused || !startTime || examData.endTime) {
        toast({ title: "Navigation Disabled", description: "Exam is paused, not started, or finished.", variant: "default" });
        return;
    }
    await contextNavigateToSection(flatSectionIdToNavigate); 
    if (isMobile) toggleSidebar();
  }, [examInfo?.sections, isPaused, startTime, examData.endTime, contextNavigateToSection, isMobile, toggleSidebar, toast]);

  const handleQuestionPillClick = useCallback((flatSectionId: string, questionIndexInFlatSection: number) => {
    if (isPaused || !startTime || examData.endTime) {
        toast({ title: "Navigation Disabled", description: "Exam is paused, not started, or finished.", variant: "default" });
        return;
    }
    let count = 0;
    let globalIndex = -1;
    for(let i=0; i < questions.length; i++) {
        if (questions[i].section === flatSectionId) {
            if (count === questionIndexInFlatSection) {
                globalIndex = i;
                break;
            }
            count++;
        }
    }

    if (globalIndex !== -1) {
      contextNavigateToQuestion(globalIndex);
      if (isMobile) toggleSidebar();
    } else {
      toast({title: "Error", description: "Could not find the question to navigate.", variant: "destructive"});
    }
  }, [isPaused, startTime, examData.endTime, questions, contextNavigateToQuestion, isMobile, toggleSidebar, toast]);

  const getQuestionStatusClass = (questionId: string): string => {
    const answer = userAnswers.find(ua => ua.questionId === questionId);
    if (answer?.selectedOption !== null) { // Answered
      // If submitted, check correctness (not available here directly, but could be added if needed)
      return 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'; 
    }
    // For now, red means unattempted/skipped. Could differentiate skipped later.
    return 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'; 
  };
  
  const currentGlobalQuestionId = questions[currentQuestionIndex]?.id;

  if (isIconCollapsed) {
    return (
      <div className="flex flex-col items-center p-2 h-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar} 
                className="rounded-full w-10 h-10 mt-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label="Expand Navigation"
              >
                <MenuIcon className="h-5 w-5"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              <p>Exam Navigation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (!examInfo || !Array.isArray(examInfo.subjects) || examInfo.subjects.length === 0) {
    return (
      <SidebarContent className="p-4 text-muted-foreground text-sm">
        No exam structure defined or available.
      </SidebarContent>
    );
  }
  
  const isExamActive = !!startTime && !examData.endTime;

  return (
    <>
      <SidebarHeader className="p-2 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">
          Exam Navigation
        </h3>
        <SidebarTrigger className="group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden md:hidden" />
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className="h-[calc(100%-4rem)]">
          <Accordion type="multiple" defaultValue={examInfo.subjects.map(s => s.subjectName)} className="w-full p-1 space-y-1">
            {examInfo.subjects.map((subject: SubjectDetail) => {
              const isCurrentSubjectActiveForUI = activeUIToggleSubject === subject.subjectName;
              return (
                <AccordionItem value={subject.subjectName} key={subject.subjectName} className="border-none">
                  <AccordionTrigger
                    onClick={() => handleSubjectHeaderClick(subject.subjectName)}
                    className={cn(
                      "w-full justify-between items-center text-sm h-auto py-2 px-2 rounded-md hover:no-underline",
                      "hover:bg-sidebar-accent focus:bg-sidebar-accent",
                      currentFlatSectionId?.startsWith(subject.subjectName) ? "bg-sidebar-secondary text-sidebar-secondary-foreground" : "bg-transparent text-sidebar-foreground",
                      !isExamActive && "opacity-70 cursor-not-allowed"
                    )}
                    disabled={!isExamActive}
                  >
                    <div className="flex items-center gap-2 flex-grow truncate">
                        {isCurrentSubjectActiveForUI ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        <span className="font-medium truncate">{subject.subjectName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ({subject.numberOfQuestionsInSubject ?? 'N/A'} Qs)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-0 pl-3 pr-1 border-l-2 border-sidebar-border ml-3">
                    {isCurrentSubjectActiveForUI && Array.isArray(subject.subjectSections) && subject.subjectSections.map((section: SectionDetail) => {
                      const flatSectionId = examInfo.sections?.find(s => s.includes(subject.subjectName) && s.includes(section.sectionNameOrType)) || `${subject.subjectName} - ${section.sectionNameOrType}`;
                      const isLoadingThisFlatSection = sectionBeingExtracted === flatSectionId;
                      const isThisFlatSectionExtracted = sectionsExtracted.includes(flatSectionId);
                      const questionsInThisFlatSection = questions.filter(q => q.section === flatSectionId);
                      const isContextCurrentFlatSection = currentFlatSectionId === flatSectionId;

                      return (
                        <div key={flatSectionId} className="mb-1">
                          <Button
                            variant={isContextCurrentFlatSection ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start items-center text-xs h-auto py-1.5 px-2 mb-1",
                              !isExamActive && "opacity-70 cursor-not-allowed",
                              isLoadingThisFlatSection && "opacity-50 cursor-wait"
                            )}
                            onClick={() => isExamActive && !isLoadingThisFlatSection && handleSectionButtonClick(subject.subjectName, section.sectionNameOrType)}
                            disabled={!isExamActive || isLoadingThisFlatSection}
                            title={section.sectionNameOrType}
                          >
                            {isLoadingThisFlatSection ? <Loader2 className="h-3 w-3 mr-1.5 shrink-0 animate-spin" /> : null}
                            <span className="truncate flex-grow text-left">{section.sectionNameOrType}</span>
                            {!isThisFlatSectionExtracted && !isLoadingThisFlatSection && <span className="text-xs text-amber-500 ml-auto">(Needs Load)</span>}
                            {isThisFlatSectionExtracted && questionsInThisFlatSection.length === 0 && !isLoadingThisFlatSection && <span className="text-xs text-red-500 ml-auto">(No Qs)</span>}
                          </Button>

                          {isContextCurrentFlatSection && isThisFlatSectionExtracted && !isLoadingThisFlatSection && (
                            <div className="pl-2 pr-1 py-1 border-l-2 border-sidebar-border/50 ml-2">
                              {questionsInThisFlatSection.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {questionsInThisFlatSection.map((q, index) => (
                                    <Button
                                      key={q.id}
                                      variant="outline"
                                      size="sm"
                                      className={cn(
                                        "h-6 w-6 p-0 text-xs rounded",
                                        getQuestionStatusClass(q.id),
                                        "text-white font-medium",
                                        q.id === currentGlobalQuestionId && "ring-2 ring-offset-1 ring-primary dark:ring-offset-background",
                                        !isExamActive && "opacity-70 cursor-not-allowed"
                                      )}
                                      onClick={() => handleQuestionPillClick(flatSectionId, index)}
                                      disabled={!isExamActive}
                                      title={`Question ${index + 1}`}
                                    >
                                      {index + 1}
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">No questions found for this section part.</p>
                              )}
                            </div>
                          )}
                          {isContextCurrentFlatSection && isLoadingThisFlatSection && (
                            <div className="pl-2 pr-1 py-1 border-l-2 border-sidebar-border/50 ml-2">
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin"/> Loading questions...
                                </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      </SidebarContent>
    </>
  );
};

export default SectionQuestionNavigator;
