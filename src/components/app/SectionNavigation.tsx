"use client";

import type React from 'react';
import { List, Loader2, Menu } from 'lucide-react'; // Added Menu
import { Button } from '@/components/ui/button'; // For the "ball"
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExamContext } from '@/hooks/useExamContext';
import { cn } from '@/lib/utils';
import {
  useSidebar, // useSidebar hook
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // For ball tooltip
import { useToast } from '@/hooks/use-toast';


interface SectionNavigationProps {
  className?: string;
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({ className }) => {
  const { 
    examData, 
    navigateToSection, 
    // extractQuestionsForSection, // No longer called directly here, navigateToSection handles it
    sectionsExtracted, 
    sectionBeingExtracted 
  } = useExamContext();
  const { toast } = useToast();
  const { examInfo, currentSection, questions, isPaused, startTime } = examData;

  // Get sidebar state from useSidebar
  const { 
    state: sidebarState, 
    isMobile, 
    collapsibleMode, 
    toggleSidebar 
  } = useSidebar();

  const isIconCollapsed = !isMobile && sidebarState === 'collapsed' && collapsibleMode === 'icon';

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
              <Menu className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            <p>Sections</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }


  if (!examInfo || !examInfo.sections || examInfo.sections.length === 0) {
    return (
        <SidebarContent className={cn("p-4 text-muted-foreground text-sm", className)}>
            No sections defined for this exam.
        </SidebarContent>
    );
  }
  
  const isExamActive = !!startTime && !examData.endTime;


  const handleSectionClick = async (sectionName: string) => {
    if (isPaused || !isExamActive) {
        toast({ title: "Navigation Disabled", description: isPaused ? "Exam is paused." : "Exam has not started or is finished.", variant: "default"});
        return;
    }
    if (currentSection === sectionName && sectionsExtracted.includes(sectionName)) {
        return; 
    }
    await navigateToSection(sectionName); 
  };


  return (
    <>
      <SidebarHeader className="p-2 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">Sections</h3>
        {/* Standard trigger for collapsing, shown when expanded. Mobile trigger is handled by Sheet */}
        <SidebarTrigger className="group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden md:hidden" />
      </SidebarHeader>
      <SidebarContent className={cn("p-0", className)}>
        <ScrollArea className="h-[calc(100%-4rem)]"> {/* Adjust based on header height */}
          <SidebarMenu className="p-2">
            {examInfo.sections.map((sectionName) => {
              const isExtracted = sectionsExtracted.includes(sectionName);
              const isBeingExtracted = sectionBeingExtracted === sectionName;
              const sectionQuestions = questions.filter(q => q.section === sectionName);
              const answeredInSection = sectionQuestions.filter(q => 
                examData.userAnswers.find(ua => ua.questionId === q.id && ua.selectedOption !== null)
              ).length;
              
              let questionsInThisSectionCount = sectionQuestions.length;
              
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
                    <span className="truncate flex-grow group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">{sectionName}</span>
                    {isExtracted && questionsInThisSectionCount > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">
                        {answeredInSection}/{questionsInThisSectionCount}
                      </span>
                    )}
                     {!isExtracted && !isBeingExtracted && (
                        <span className="text-xs text-amber-500 ml-auto group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">(Needs Load)</span>
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
