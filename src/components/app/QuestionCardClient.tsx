"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import type { Question, UserAnswer } from '@/types/exam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useExamContext } from '@/hooks/useExamContext';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface QuestionCardClientProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  isSubmitted: boolean; // To show correct/incorrect answers after submission
}

const QuestionCardClient: React.FC<QuestionCardClientProps> = ({ question, questionNumber, isSubmitted }) => {
  const { examData, answerQuestion } = useExamContext();
  const userAnswer = examData.userAnswers.find(ans => ans.questionId === question.id);
  const [selectedValue, setSelectedValue] = useState<string | null>(userAnswer?.selectedOption || null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  useEffect(() => {
    // Shuffle options once when the question changes or component mounts
    // This ensures options are consistent for this question instance if user navigates away and back
    setShuffledOptions([...question.options].sort(() => Math.random() - 0.5));
    setSelectedValue(userAnswer?.selectedOption || null);
  }, [question, userAnswer?.selectedOption]);


  const handleOptionChange = (value: string) => {
    if (isSubmitted) return; // Don't allow changes after submission
    setSelectedValue(value);
    answerQuestion(question.id, value);
  };

  const getOptionStyle = (option: string) => {
    if (!isSubmitted) return "";
    if (option === question.correctAnswer) return "text-green-600 border-green-500 bg-green-50";
    if (option === selectedValue && option !== question.correctAnswer) return "text-red-600 border-red-500 bg-red-50";
    return "border-border";
  };

  const getIcon = (option: string) => {
    if (!isSubmitted) return null;
    if (option === question.correctAnswer) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (option === selectedValue && option !== question.correctAnswer) return <XCircle className="h-5 w-5 text-red-600" />;
    return null;
  }

  return (
    <Card className="w-full shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-secondary/30">
        <CardTitle className="text-xl md:text-2xl">Question {questionNumber}</CardTitle>
        <CardDescription className="text-base">{question.section}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{question.questionText}</p>
        
        <RadioGroup 
            value={selectedValue ?? undefined} 
            onValueChange={handleOptionChange} 
            className="space-y-3"
            disabled={isSubmitted}
        >
          {shuffledOptions.map((option, index) => (
            <Label
              key={index}
              htmlFor={`${question.id}-option-${index}`}
              className={cn(
                "flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent/50",
                selectedValue === option && !isSubmitted && "ring-2 ring-primary border-primary bg-primary/10",
                isSubmitted && getOptionStyle(option)
              )}
            >
              <RadioGroupItem 
                value={option} 
                id={`${question.id}-option-${index}`} 
                disabled={isSubmitted}
                className={cn(isSubmitted && selectedValue === option ? "border-primary" : "")}
              />
              <span className="flex-1">{option}</span>
              {isSubmitted && getIcon(option)}
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
              <p className="flex items-center gap-2 font-semibold text-red-600"><XCircle /> Incorrect. The correct answer was: {question.correctAnswer}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCardClient;
