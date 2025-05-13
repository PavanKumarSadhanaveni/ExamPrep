"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExamContext } from '@/hooks/useExamContext';
import { calculateResults } from '@/lib/resultsUtils';
import type { OverallResults, SectionSummary } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Award, RefreshCw, ListChecks, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import LoadingDots from './LoadingDots';

const ResultsDisplayClient: React.FC = () => {
  const router = useRouter();
  const { examData, resetExam, isLoading, setIsLoading } = useExamContext();
  const [results, setResults] = useState<OverallResults | null>(null);

  useEffect(() => {
    setIsLoading(true);
    if (examData.questions.length > 0 && examData.endTime) {
      const calculatedResults = calculateResults(examData);
      setResults(calculatedResults);
    } else if (!examData.endTime && examData.questions.length > 0) {
      // Exam not submitted, redirect to test
      router.replace('/exam/test');
    } else {
      // No questions or no results, redirect to upload
      router.replace('/');
    }
    setIsLoading(false);
  }, [examData, router, setIsLoading]);

  const handleRetakeExam = () => {
    resetExam();
    router.push('/');
  };

  if (isLoading || !results) {
    return <LoadingDots text="Calculating results..." />;
  }

  if (results.totalQuestions === 0) {
     return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle /> No Results Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Results could not be calculated. This might be because the exam was not completed or there were no questions.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRetakeExam} variant="outline">Start New Exam</Button>
        </CardFooter>
      </Card>
    );
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let timeString = "";
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    timeString += `${seconds}s`;
    return timeString.trim();
  };

  const scoreColor = results.finalScore >= 70 ? 'text-green-600' : results.finalScore >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <Award className={`mx-auto h-16 w-16 ${scoreColor} mb-4`} />
        <CardTitle className="text-3xl font-bold">Exam Results</CardTitle>
        <CardDescription className="text-lg">
          Here's how you performed in "{examData.examInfo?.examName || 'the Exam'}".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Overall Score */}
        <Card className="bg-secondary/30">
          <CardHeader>
            <CardTitle className="text-2xl">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-5xl font-bold mb-2">
                <span className={scoreColor}>{results.finalScore.toFixed(2)}%</span>
              </p>
              <Progress value={results.finalScore} className={`h-3 ${scoreColor.replace('text-', 'bg-')}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Correct</p>
                <p className="text-xl font-semibold text-green-600 flex items-center justify-center gap-1"><CheckCircle size={20}/> {results.correctAnswers}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Incorrect</p>
                <p className="text-xl font-semibold text-red-600 flex items-center justify-center gap-1"><XCircle size={20}/> {results.wrongAnswers}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="text-xl font-semibold text-yellow-600 flex items-center justify-center gap-1"><MinusCircle size={20}/> {results.skippedAnswers}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Qs</p>
                <p className="text-xl font-semibold">{results.totalQuestions}</p>
              </div>
            </div>
             <p className="text-sm text-muted-foreground text-center mt-4">Total time taken: {formatTime(results.totalTimeTaken)}</p>
          </CardContent>
        </Card>

        {/* Section-wise Scores */}
        {results.sectionSummaries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2"><ListChecks /> Section Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-center">Correct</TableHead>
                    <TableHead className="text-center">Incorrect</TableHead>
                    <TableHead className="text-center">Skipped</TableHead>
                    <TableHead className="text-right">Score (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.sectionSummaries.map((sec, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{sec.name}</TableCell>
                      <TableCell className="text-center text-green-600">{sec.correctAnswers}</TableCell>
                      <TableCell className="text-center text-red-600">{sec.wrongAnswers}</TableCell>
                      <TableCell className="text-center text-yellow-600">{sec.skippedAnswers}</TableCell>
                      <TableCell className="text-right font-semibold">{sec.score.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
        {/* <Button variant="outline" onClick={() => router.push('/exam/review')}>Review Answers</Button> */}
        {/* Review Answers feature can be added later */}
        <Button onClick={handleRetakeExam} className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
          <RefreshCw className="mr-2 h-5 w-5" /> Retake Exam
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResultsDisplayClient;
