
"use client";

import React, { useState, useEffect } from 'react'; // Explicit React import
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useExamContext } from "@/hooks/useExamContext";
import type { Question } from "@/types/exam";
import { Bot, MessageSquareQuestion, Loader2 } from "lucide-react"; // Added Bot icon
import { ScrollArea } from '../ui/scroll-area';

interface HintBotProps {
  currentQuestion: Question | null;
  isExamFinished: boolean;
}

const HintBot: React.FC<HintBotProps> = ({ currentQuestion, isExamFinished }) => {
  const { 
    examData, 
    requestHint, 
    activeQuestionHints, 
    hintRequestLoading 
  } = useExamContext();
  const { isPaused } = examData;

  const [isOpen, setIsOpen] = useState(false);

  // Reset hints display when question changes or popover closes
  useEffect(() => {
    if (!isOpen && activeQuestionHints.length > 0) {
      // Potentially clear activeQuestionHints here if they should only live while popover is open
      // For now, they persist until next question to allow re-opening popover to see them.
    }
  }, [isOpen, currentQuestion, activeQuestionHints.length]);

  if (!currentQuestion || isExamFinished || isPaused) {
    // Don't render the bot if no current question, exam is finished, or paused.
    // The parent component (TestInterfaceClient) also has similar logic for hiding it,
    // but this ensures the HintBot itself doesn't try to render its trigger.
    return null; 
  }

  const userAnswer = examData.userAnswers.find(ans => ans.questionId === currentQuestion.id);
  const hintsUsedCount = userAnswer?.hintsUsed || 0;
  const hintsRemaining = 3 - hintsUsedCount;

  const handleGetHint = () => {
    if (currentQuestion && hintsRemaining > 0 && !hintRequestLoading) {
      requestHint(currentQuestion.id, currentQuestion.questionText, currentQuestion.options);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="hint-bot-trigger"
          variant="outline" // Changed variant for better fitting with other footer buttons
          size="icon"
          className="rounded-full h-10 w-10" // Standard icon size, made circular
          disabled={!currentQuestion || isExamFinished || isPaused}
          aria-label="Get a hint from AI Bot"
          title={`Hints used: ${hintsUsedCount}/3`}
        >
          <Bot className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="end" 
        className="w-80 shadow-xl rounded-lg p-0" // Removed default padding to control it fully
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus trap on open
      >
        <div className="flex flex-col">
          <div className="p-4 border-b bg-secondary/50 rounded-t-lg">
            <h4 className="font-medium text-sm text-foreground">AI Hint Bot</h4>
            <p className="text-xs text-muted-foreground">Need a nudge for this question?</p>
          </div>

          <ScrollArea className="h-auto max-h-[200px] p-4 text-sm space-y-2">
            {activeQuestionHints.length === 0 && hintsRemaining > 0 && !hintRequestLoading && (
              <p className="text-muted-foreground italic">Click "Get Hint" to receive your first clue.</p>
            )}
            {activeQuestionHints.map((hint, index) => (
              <div key={index} className="p-2 bg-accent/50 rounded-md text-accent-foreground">
                <strong className="text-xs block text-muted-foreground">Hint {index + 1}:</strong>
                {hint}
              </div>
            ))}
            {hintRequestLoading && <div className="flex items-center justify-center p-2"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>}
          </ScrollArea>
          
          <div className="p-3 border-t mt-auto">
            {hintsRemaining > 0 ? (
              <Button onClick={handleGetHint} disabled={hintRequestLoading} className="w-full" size="sm">
                {hintRequestLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Get Hint ({hintsRemaining} left)
              </Button>
            ) : (
              <p className="text-xs text-center text-muted-foreground">That's all the help I can give for this one! 😊</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HintBot;
