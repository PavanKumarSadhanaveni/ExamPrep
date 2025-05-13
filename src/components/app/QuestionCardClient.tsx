
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import type { Question } from '@/types/exam'; // UserAnswer type removed as it's handled by context
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
// Button removed as it's not used directly here
import { useExamContext } from '@/hooks/useExamContext';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface QuestionCardClientProps {
  question: Question;
  questionNumber: number; // This is the display number (e.g., 1 of 10 in current view)
  // totalQuestions removed as it might be ambiguous (total in section vs total overall)
  isSubmitted: boolean; // To show correct/incorrect answers after submission
}

const QuestionCardClient: React.FC<QuestionCardClientProps> = ({ question, questionNumber, isSubmitted }) => {
  const { examData, answerQuestion } = useExamContext();
  const userAnswer = examData.userAnswers.find(ans => ans.questionId === question.id);
  
  // selectedValue will now directly reflect the userAnswer from context, or initialize to null
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  useEffect(() => {
    // Sync selectedValue with the context's userAnswer when the question changes or answers update
    const currentAns = examData.userAnswers.find(ans => ans.questionId === question.id);
    setSelectedValue(currentAns?.selectedOption || null);
  }, [question.id, examData.userAnswers]); // Rerun when question.id changes or userAnswers array changes


  const handleOptionChange = (value: string) => {
    if (isSubmitted || examData.isPaused) return; 
    setSelectedValue(value); // Optimistically update UI
    answerQuestion(question.id, value);
  };

  const getOptionStyle = (optionText: string) => {
    if (!isSubmitted) return "";
    // Check if this option was the one selected by the user
    const wasSelected = selectedValue === optionText;
    // Check if this option is the correct answer
    const isCorrectAnswer = optionText === question.correctAnswer;

    if (isCorrectAnswer) return "text-green-600 border-green-500 bg-green-50";
    if (wasSelected && !isCorrectAnswer) return "text-red-600 border-red-500 bg-red-50";
    
    return "border-border";
  };

  const getIcon = (optionText: string) => {
    if (!isSubmitted) return null;
    // Check if this option was the one selected by the user
    const wasSelected = selectedValue === optionText;
    // Check if this option is the correct answer
    const isCorrectAnswer = optionText === question.correctAnswer;

    if (isCorrectAnswer) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (wasSelected && !isCorrectAnswer) return <XCircle className="h-5 w-5 text-red-600" />;
    
    return null;
  }

  // question.options are now pre-shuffled by the ExamContext
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
            value={selectedValue ?? undefined} // Ensure RadioGroup gets undefined if selectedValue is null
            onValueChange={handleOptionChange} 
            className="space-y-3"
            disabled={isSubmitted || examData.isPaused}
        >
          {optionsToDisplay.map((optionText, index) => (
            <Label
              key={`${question.id}-option-${index}`} // Use optionText or a more stable key if options can have duplicates (though unlikely for answers)
              htmlFor={`${question.id}-option-${index}`}
              className={cn(
                "flex items-center space-x-3 p-4 border rounded-lg transition-all",
                !(isSubmitted || examData.isPaused) && "cursor-pointer hover:bg-accent/50",
                selectedValue === optionText && !isSubmitted && !examData.isPaused && "ring-2 ring-primary border-primary bg-primary/10",
                isSubmitted && getOptionStyle(optionText),
                examData.isPaused && "cursor-not-allowed opacity-70"
              )}
            >
              <RadioGroupItem 
                value={optionText} 
                id={`${question.id}-option-${index}`} 
                disabled={isSubmitted || examData.isPaused}
                className={cn(isSubmitted && selectedValue === optionText ? (optionText === question.correctAnswer ? "border-green-500" : "border-red-500") : "border-primary")}
              />
              <span className="flex-1">{optionText}</span>
              {isSubmitted && getIcon(optionText)}
            </Label>
          ))}
        </RadioGroup>

        {isSubmitted && userAnswer && (
          <div className="mt-4 p-4 rounded-md border">
            {userAnswer.selectedOption === null ? (
              <p className="flex items-center gap-2 font-semibold"><MinusCircle className="text-yellow-500"/> You skipped this question.</p>
            ) : userAnswer.isCorrect ? (
              <p className="flex items-center gap-2 font-semibold text-green-600"><CheckCircle /> Correct!</p>
            ) : (
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold text-red-600"><XCircle /> Incorrect.</p>
                <p className="text-sm text-muted-foreground">Your answer: {userAnswer.selectedOption}</p>
                <p className="text-sm">Correct answer: <span className="font-semibold text-green-700">{question.correctAnswer}</span></p>
              </div>
            )}
          </div>
        )}
         {!isSubmitted && examData.isPaused && (
            <div className="mt-4 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                Exam is paused. Resume to answer.
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCardClient;

