"use client";

import type React from 'react';
import { List, Loader2 } from 'lucide-react'; // Added Loader2
// Button is not used here anymore, using SidebarMenuButton from sidebar component
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExamContext } from '@/hooks/useExamContext';
import { cn } from '@/lib/utils';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';


interface SectionNavigationProps {
  className?: string;
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({ className }) => {
  const { 
    examData, 
    navigateToSection, 
    extractQuestionsForSection, 
    sectionsExtracted, 
    sectionBeingExtracted 
  } = useExamContext();
  const { toast } = useToast();
  const { examInfo, currentSection, questions, isPaused, startTime } = examData;

  if (!examInfo || !examInfo.sections || examInfo.sections.length === 0) {
    return (
        <SidebarContent className="p-4 text-muted-foreground text-sm">
            No sections defined for this exam.
        </SidebarContent>
    );
  }
  
  // Only allow navigation if exam has started
  const isExamActive = !!startTime && !examData.endTime;


  const handleSectionClick = async (sectionName: string) => {
    if (isPaused || !isExamActive) {
        toast({ title: "Navigation Disabled", description: isPaused ? "Exam is paused." : "Exam has not started or is finished.", variant: "default"});
        return;
    }
    if (currentSection === sectionName && sectionsExtracted.includes(sectionName)) {
        return; // Already on this section and it's loaded
    }
    await navigateToSection(sectionName); // navigateToSection now handles loading if needed
  };


  return (
    <>
      <SidebarHeader className="p-2 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Sections</h3>
        <SidebarTrigger className="md:hidden group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className="h-[calc(100%-4rem)]">
          <SidebarMenu className="p-2">
            {examInfo.sections.map((sectionName) => {
              const isExtracted = sectionsExtracted.includes(sectionName);
              const isBeingExtracted = sectionBeingExtracted === sectionName;
              const sectionQuestions = questions.filter(q => q.section === sectionName);
              const answeredInSection = sectionQuestions.filter(q => 
                examData.userAnswers.find(ua => ua.questionId === q.id && ua.selectedOption !== null)
              ).length;
              
              let questionsInThisSectionCount = sectionQuestions.length;
              if (!isExtracted && !isBeingExtracted && examInfo.numberOfQuestions && examInfo.sections.length) {
                  // Estimate if not loaded, very rough
                  // This could be improved if AI provides per-section question counts in examInfo
              }


              return (
                <SidebarMenuItem key={sectionName}>
                  <SidebarMenuButton
                    onClick={() => handleSectionClick(sectionName)}
                    isActive={currentSection === sectionName}
                    variant="default"
                    disabled={isPaused || !isExamActive || (isBeingExtracted && currentSection !== sectionName)}
                    className={cn(
                      "w-full justify-start items-center",
                      currentSection === sectionName && "bg-sidebar-accent text-sidebar-accent-foreground",
                      (isPaused || !isExamActive) && "cursor-not-allowed opacity-70",
                      (!isPaused && isExamActive && currentSection !== sectionName) && "hover:bg-sidebar-accent/50",
                       isBeingExtracted && currentSection !== sectionName && "opacity-50 cursor-wait"
                    )}
                    tooltip={{
                      children: (
                        <div>
                          <p>{sectionName}</p>
                          {isBeingExtracted && <p className="text-xs">(Loading...)</p>}
                          {!isBeingExtracted && !isExtracted && <p className="text-xs">(Not loaded)</p>}
                          {isExtracted && <p className="text-xs">({answeredInSection}/{questionsInThisSectionCount} answered)</p>}
                        </div>
                      ),
                      className: "text-xs"
                    }}
                  >
                    {isBeingExtracted ? (
                      <Loader2 className="h-4 w-4 mr-2 shrink-0 animate-spin" />
                    ) : (
                      <List className="h-4 w-4 mr-2 shrink-0" />
                    )}
                    <span className="truncate flex-grow">{sectionName}</span>
                    {isExtracted && questionsInThisSectionCount > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {answeredInSection}/{questionsInThisSectionCount}
                      </span>
                    )}
                     {!isExtracted && !isBeingExtracted && (
                        <span className="text-xs text-amber-500 ml-auto">(Needs Load)</span>
                     )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </>
  );
};

export default SectionNavigation;
