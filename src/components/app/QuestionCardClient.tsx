
"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Import React explicitly
import type { Question } from '@/types/exam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useExamContext } from '@/hooks/useExamContext';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface QuestionCardClientProps {
  question: Question;
  questionNumber: number;
  isSubmitted: boolean;
}

const QuestionCardClient: React.FC<QuestionCardClientProps> = ({ question, questionNumber, isSubmitted }) => {
  const { examData, answerQuestion } = useExamContext();
  const userAnswer = examData.userAnswers.find(ans => ans.questionId === question.id);
  
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  useEffect(() => {
    const currentAns = examData.userAnswers.find(ans => ans.questionId === question.id);
    setSelectedValue(currentAns?.selectedOption || null);
  }, [question.id, examData.userAnswers]);


  const handleOptionChange = useCallback((value: string) => {
    if (isSubmitted || examData.isPaused) return; 
    setSelectedValue(value);
    answerQuestion(question.id, value);
  }, [isSubmitted, examData.isPaused, answerQuestion, question.id]);

  const getOptionStyle = (optionText: string) => {
    if (!isSubmitted) return "";
    const wasSelected = selectedValue === optionText;
    const isCorrectAnswer = optionText === question.correctAnswer;

    if (isCorrectAnswer) return "text-green-600 border-green-500 bg-green-50 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
    if (wasSelected && !isCorrectAnswer) return "text-red-600 border-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
    
    return "border-border";
  };

  const getIcon = (optionText: string) => {
    if (!isSubmitted) return null;
    const wasSelected = selectedValue === optionText;
    const isCorrectAnswer = optionText === question.correctAnswer;

    if (isCorrectAnswer) return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    if (wasSelected && !isCorrectAnswer) return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    
    return null;
  }

  const optionsToDisplay = question.options;

  return (
    <Card className="w-full shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-secondary/30">
        <CardTitle className="text-xl md:text-2xl">Question {questionNumber}</CardTitle>
        <CardDescription className="text-base">{question.section} {question.originalPdfQuestionNumber ? `(Original PDF No: ${question.originalPdfQuestionNumber})` : ''}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{question.questionText}</p>
        
        <RadioGroup 
            value={selectedValue ?? undefined}
            onValueChange={handleOptionChange} 
            className="space-y-3"
            disabled={isSubmitted || examData.isPaused}
        >
          {optionsToDisplay.map((optionText, index) => (
            <Label
              key={`${question.id}-option-${index}`}
              htmlFor={`${question.id}-option-${index}`}
              className={cn(
                "flex items-center space-x-3 p-4 border rounded-lg transition-all",
                !(isSubmitted || examData.isPaused) && "cursor-pointer hover:bg-accent/50",
                selectedValue === optionText && !isSubmitted && !examData.isPaused && "ring-2 ring-primary border-primary bg-primary/10 dark:bg-primary/20",
                isSubmitted && getOptionStyle(optionText),
                examData.isPaused && "cursor-not-allowed opacity-70"
              )}
            >
              <RadioGroupItem 
                value={optionText} 
                id={`${question.id}-option-${index}`} 
                disabled={isSubmitted || examData.isPaused}
                className={cn(isSubmitted && selectedValue === optionText ? (optionText === question.correctAnswer ? "border-green-500 dark:border-green-700" : "border-red-500 dark:border-red-700") : "border-primary")}
              />
              <span className="flex-1">{optionText}</span>
              {isSubmitted && getIcon(optionText)}
            </Label>
          ))}
        </RadioGroup>

        {isSubmitted && userAnswer && (
          <div className="mt-4 p-4 rounded-md border">
            {userAnswer.selectedOption === null ? (
              <p className="flex items-center gap-2 font-semibold"><MinusCircle className="text-yellow-500 dark:text-yellow-400"/> You skipped this question.</p>
            ) : userAnswer.isCorrect ? (
              <p className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400"><CheckCircle /> Correct!</p>
            ) : (
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400"><XCircle /> Incorrect.</p>
                <p className="text-sm text-muted-foreground">Your answer: {userAnswer.selectedOption}</p>
                <p className="text-sm">Correct answer: <span className="font-semibold text-green-700 dark:text-green-500">{question.correctAnswer}</span></p>
              </div>
            )}
          </div>
        )}
         {!isSubmitted && examData.isPaused && (
            <div className="mt-4 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 text-sm">
                Exam is paused. Resume to answer.
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(QuestionCardClient);
