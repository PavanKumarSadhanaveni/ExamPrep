
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useExamContext } from "@/hooks/useExamContext";
import type { Question } from "@/types/exam";
import { Bot, Loader2, ThumbsUp, ThumbsDown, Info } from "lucide-react";
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface HintBotProps {
  currentQuestion: Question | null;
  isExamFinished: boolean;
}

const COOLDOWN_PERIOD_MS = 5000; // 5 seconds

const HintBot: React.FC<HintBotProps> = ({ currentQuestion, isExamFinished }) => {
  const {
    examData,
    requestHint,
    activeQuestionHints,
    hintRequestLoading
  } = useExamContext();
  const { isPaused, userAnswers } = examData;

  const [isOpen, setIsOpen] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);

  const currentQuestionUserAnswer = currentQuestion ? userAnswers.find(ans => ans.questionId === currentQuestion.id) : null;
  const hintsTakenForCurrentQuestion = currentQuestionUserAnswer?.hintsTaken || [];

  useEffect(() => {
    // Clear local cooldown if popover is closed or question changes
    if (!isOpen || !currentQuestion) {
      setCooldownActive(false);
      setCooldownTimeLeft(0);
    }
  }, [isOpen, currentQuestion]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (cooldownActive && cooldownTimeLeft > 0) {
      timerId = setInterval(() => {
        setCooldownTimeLeft(prev => Math.max(0, prev - 1000));
      }, 1000);
    } else if (cooldownActive && cooldownTimeLeft === 0) {
      setCooldownActive(false);
    }
    return () => clearInterval(timerId);
  }, [cooldownActive, cooldownTimeLeft]);

  const startCooldown = () => {
    setCooldownActive(true);
    setCooldownTimeLeft(COOLDOWN_PERIOD_MS);
  };

  const handleGetHint = useCallback(async () => {
    if (currentQuestion && hintsTakenForCurrentQuestion.length < 3 && !hintRequestLoading && !cooldownActive) {
      const currentHintLevel = hintsTakenForCurrentQuestion.length + 1;
      const success = await requestHint(currentQuestion.id, currentQuestion.questionText, currentQuestion.options, currentHintLevel);
      if (success) {
        startCooldown();
      }
    }
  }, [currentQuestion, hintsTakenForCurrentQuestion.length, hintRequestLoading, cooldownActive, requestHint, startCooldown]);

  if (!currentQuestion || isExamFinished || isPaused) {
    return null;
  }

  const getHintButtonConfig = () => {
    const hintsTakenCount = hintsTakenForCurrentQuestion.length;
    if (hintsTakenCount === 0) {
      return { text: "Get General Hint (-10% Score)", level: 1, penaltyText: "Level 1: General topic or broad concept." };
    } else if (hintsTakenCount === 1) {
      return { text: "Get Specific Hint (-15% Addtl.)", level: 2, penaltyText: "Level 2: Suggest method or principle." };
    } else if (hintsTakenCount === 2) {
      return { text: "Get Final Clue (-15% Addtl.)", level: 3, penaltyText: "Level 3: Specific step or key piece of info." };
    }
    return null; // No more hints
  };

  const hintButtonConfig = getHintButtonConfig();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="hint-bot-trigger"
          variant="default" // Changed to default for primary color
          size="icon"
          className="rounded-full h-10 w-10 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-[60]"
          disabled={!currentQuestion || isExamFinished || isPaused}
          aria-label="Get a hint from AI Bot"
          title={`Hints taken: ${hintsTakenForCurrentQuestion.length}/3`}
        >
          <Bot className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 shadow-xl rounded-lg p-0" // p-0 to control padding internally
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevents focus stealing
      >
        <div className="flex flex-col">
          <div className="p-3 border-b bg-secondary/50 rounded-t-lg">
            <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
              <Bot className="h-4 w-4 text-primary" />
              AI Hint Bot
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">Need a nudge for this question?</p>
          </div>

          <ScrollArea className="h-auto max-h-60 p-4 text-sm space-y-3">
            {activeQuestionHints && activeQuestionHints.length > 0 && activeQuestionHints.map((hint, index) => (
              <div key={index} className="p-2.5 bg-accent/60 rounded-md text-accent-foreground shadow-sm">
                <strong className="text-xs block text-muted-foreground mb-0.5">Hint {index + 1}:</strong>
                {hint}
              </div>
            ))}
            {hintRequestLoading && (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary"/>
              </div>
            )}
            {(!activeQuestionHints || activeQuestionHints.length === 0) && !hintButtonConfig && !hintRequestLoading && (
                <p className="text-muted-foreground italic text-center py-2">No hints requested yet.</p>
            )}
            {activeQuestionHints && activeQuestionHints.length > 0 && !hintRequestLoading && (
                 <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center mb-1">Was this helpful?</p>
                    <div className="flex justify-center gap-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-green-100 dark:hover:bg-green-800/50">
                            <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-500"/>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50" >
                            <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-500"/>
                        </Button>
                    </div>
                </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t bg-background rounded-b-lg">
            {hintButtonConfig ? (
              <Button
                onClick={handleGetHint}
                disabled={hintRequestLoading || cooldownActive || hintsTakenForCurrentQuestion.length >= 3}
                className="w-full"
                size="sm"
              >
                {hintRequestLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {cooldownActive ? `Wait ${Math.ceil(cooldownTimeLeft / 1000)}s` : hintButtonConfig.text}
              </Button>
            ) : (
              <p className="text-xs text-center text-muted-foreground">
                {hintsTakenForCurrentQuestion.length >=3 ? "That's all the help I can give for this one! 😊" : "All available hints shown."}
              </p>
            )}
            {hintButtonConfig && (
                 <p className="text-xs text-muted-foreground text-center mt-1.5 flex items-center justify-center gap-1">
                    <Info size={12}/> {hintButtonConfig.penaltyText}
                </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HintBot;
