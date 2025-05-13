"use client";

import type React from 'react';
import { useState, useEffect }from 'react';
import { useExamContext } from '@/hooks/useExamContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';


const SectionQuestionNavigator: React.FC = () => {
  const { 
    examData, 
    navigateToQuestion, 
    navigateToSection,
    sectionsExtracted,
    sectionBeingExtracted,
  } = useExamContext();
  const { toast } = useToast();
  const { examInfo, questions, userAnswers, currentSection, startTime, isPaused, currentQuestionIndex } = examData;
  
  // activeUIToggleSection controls which section's questions are visually expanded in the navigator
  const [activeUIToggleSection, setActiveUIToggleSection] = useState<string | null>(null);

  const { state: sidebarState, isMobile, collapsibleMode, toggleSidebar } = useSidebar();
  const isIconCollapsed = !isMobile && sidebarState === 'collapsed' && collapsibleMode === 'icon';


  useEffect(() => {
    // When the context's currentSection changes (e.g., by navigating questions in the main panel),
    // automatically expand that section in this navigator.
    if (currentSection) {
      setActiveUIToggleSection(currentSection);
    }
  }, [currentSection]);

  const handleSectionHeaderClick = async (sectionName: string) => {
    // If this section is already the active one for UI toggle, and also the current exam section, do nothing or collapse UI.
    // Otherwise, navigate to it. navigateToSection will handle loading and setting it as current.
    if (activeUIToggleSection === sectionName && currentSection === sectionName) {
         setActiveUIToggleSection(null); // Collapse UI if clicked again
    } else {
        await navigateToSection(sectionName); 
        // useEffect will set activeUIToggleSection based on context's currentSection change.
    }
  };

  const handleQuestionPillClick = (sectionName: string, questionIndexInSection: number) => {
    if (isPaused || !startTime || examData.endTime) {
        toast({ title: "Navigation Disabled", description: "Exam is paused, not started, or finished.", variant: "default" });
        return;
    }
    const questionsInSection = questions.filter(q => q.section === sectionName);
    const targetQuestion = questionsInSection[questionIndexInSection];
    if (targetQuestion) {
      const globalIndex = questions.findIndex(q => q.id === targetQuestion.id);
      if (globalIndex !== -1) {
        navigateToQuestion(globalIndex);
        if (isMobile) toggleSidebar(); // Close sidebar on mobile after selection
      }
    }
  };

  const getQuestionStatusClass = (questionId: string): string => {
    const answer = userAnswers.find(ua => ua.questionId === questionId);
    if (answer?.selectedOption !== null) {
      return 'bg-green-500 hover:bg-green-600'; // Answered
    }
    // Could add a "marked for review" status later if needed with purple
    return 'bg-red-500 hover:bg-red-600'; // Unanswered or Skipped
  };
  
  const currentGlobalQuestionId = questions[currentQuestionIndex]?.id;

  if (isIconCollapsed) {
    return (
      <div className="flex flex-col items-center p-2 h-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="rounded-full w-10 h-10 mt-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Expand Sections"
            >
              {/* Use a generic icon like Menu or a custom exam-related one if available */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            <p>Sections & Questions</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }


  if (!examInfo || !examInfo.sections || examInfo.sections.length === 0) {
    return (
      <SidebarContent className="p-4 text-muted-foreground text-sm">
        No sections defined.
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
          <SidebarMenu className="p-2 space-y-1">
            {examInfo.sections.map((sectionName) => {
              const isCurrentActiveSection = activeUIToggleSection === sectionName;
              const isLoadingThisSection = sectionBeingExtracted === sectionName;
              const areQuestionsLoadedForThisSection = sectionsExtracted.includes(sectionName);
              const questionsInThisSection = questions.filter(q => q.section === sectionName);
              const isContextCurrentSection = currentSection === sectionName;

              return (
                <SidebarMenuItem key={sectionName} className="space-y-1">
                  <Button
                    variant={isContextCurrentSection ? "secondary" : "ghost"}
                    className={cn(
                        "w-full justify-start items-center text-sm h-auto py-2 px-2",
                        !isExamActive && "opacity-70 cursor-not-allowed",
                        isLoadingThisSection && "opacity-50 cursor-wait"
                    )}
                    onClick={() => isExamActive && !isLoadingThisSection && handleSectionHeaderClick(sectionName)}
                    disabled={!isExamActive || isLoadingThisSection}
                    aria-expanded={isCurrentActiveSection}
                  >
                    {isLoadingThisSection ? (
                      <Loader2 className="h-4 w-4 mr-2 shrink-0 animate-spin" />
                    ) : isCurrentActiveSection ? (
                      <ChevronDown className="h-4 w-4 mr-2 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2 shrink-0" />
                    )}
                    <span className="truncate flex-grow">{sectionName}</span>
                    {!areQuestionsLoadedForThisSection && !isLoadingThisSection && <span className="text-xs text-amber-500 ml-auto">(Needs Load)</span>}
                    {areQuestionsLoadedForThisSection && questionsInThisSection.length === 0 && <span className="text-xs text-red-500 ml-auto">(No Qs)</span>}
                  </Button>

                  {isCurrentActiveSection && areQuestionsLoadedForThisSection && (
                    <div className="pl-4 pr-1 py-2 border-l-2 border-sidebar-border ml-3">
                      {questionsInThisSection.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {questionsInThisSection.map((q, index) => (
                            <Button
                              key={q.id}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-7 w-7 p-0 text-xs rounded-md",
                                getQuestionStatusClass(q.id),
                                "text-white font-medium",
                                q.id === currentGlobalQuestionId && "ring-2 ring-offset-2 ring-primary dark:ring-offset-background",
                                !isExamActive && "opacity-70 cursor-not-allowed"
                              )}
                              onClick={() => handleQuestionPillClick(sectionName, index)}
                              disabled={!isExamActive}
                              title={`Question ${index + 1}`}
                            >
                              {index + 1}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No questions loaded for this section.</p>
                      )}
                    </div>
                  )}
                   {isCurrentActiveSection && isLoadingThisSection && (
                     <div className="pl-4 pr-1 py-2 border-l-2 border-sidebar-border ml-3">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin"/> Loading questions...
                        </div>
                     </div>
                   )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </>
  );
};

export default SectionQuestionNavigator;