"use client";

import type React from 'react';
import { List } from 'lucide-react';
import { Button } from '@/components/ui/button';
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


interface SectionNavigationProps {
  className?: string;
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({ className }) => {
  const { examData, navigateToSection } = useExamContext();
  const { examInfo, currentSection, questions } = examData;

  if (!examInfo || !examInfo.sections || examInfo.sections.length === 0) {
    return null; 
  }
  
  const sectionsWithQuestionStatus = examInfo.sections.map(sectionName => {
    const sectionQuestions = questions.filter(q => q.section === sectionName);
    const answeredCount = sectionQuestions.filter(q => {
      const userAnswer = examData.userAnswers.find(ua => ua.questionId === q.id);
      return userAnswer && userAnswer.selectedOption !== null;
    }).length;
    return {
      name: sectionName,
      total: sectionQuestions.length,
      answered: answeredCount,
    };
  });


  return (
    <>
      <SidebarHeader className="p-2 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Sections</h3>
        <SidebarTrigger className="md:hidden group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className="h-[calc(100%-4rem)]"> {/* Adjust height if header/footer changes */}
          <SidebarMenu className="p-2">
            {sectionsWithQuestionStatus.map((secInfo) => (
              <SidebarMenuItem key={secInfo.name}>
                <SidebarMenuButton
                  onClick={() => navigateToSection(secInfo.name)}
                  isActive={currentSection === secInfo.name}
                  variant="default"
                  className={cn(
                    "w-full justify-start",
                    currentSection === secInfo.name ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
                  )}
                  tooltip={{
                    children: `${secInfo.name} (${secInfo.answered}/${secInfo.total})`,
                    className: "text-xs"
                  }}
                >
                  <List className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate flex-grow">{secInfo.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{secInfo.answered}/{secInfo.total}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </>
  );
};

export default SectionNavigation;
