import type { ExamData, OverallResults, SectionSummary, Question } from '@/types/exam';

export function calculateResults(examData: ExamData): OverallResults {
  const { questions, userAnswers, startTime, endTime, examInfo } = examData;

  if (!questions || questions.length === 0) {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      skippedAnswers: 0,
      finalScore: 0,
      totalTimeTaken: 0,
      sectionSummaries: [],
    };
  }

  let totalCorrect = 0;
  let totalWrong = 0;
  let totalSkipped = 0;

  const sectionMap: { [key: string]: { name: string, total: number, correct: number, wrong: number, skipped: number, questions: Question[] } } = {};

  questions.forEach(q => {
    if (!sectionMap[q.section]) {
      sectionMap[q.section] = { name: q.section, total: 0, correct: 0, wrong: 0, skipped: 0, questions: [] };
    }
    sectionMap[q.section].total++;
    sectionMap[q.section].questions.push(q);

    const userAnswer = userAnswers.find(ans => ans.questionId === q.id);
    if (!userAnswer || userAnswer.selectedOption === null) {
      totalSkipped++;
      sectionMap[q.section].skipped++;
    } else if (userAnswer.isCorrect) {
      totalCorrect++;
      sectionMap[q.section].correct++;
    } else {
      totalWrong++;
      sectionMap[q.section].wrong++;
    }
  });

  const sectionSummaries: SectionSummary[] = Object.values(sectionMap).map(sec => {
    const marksPerQ = examInfo?.marksPerQuestion || 1; // Assume 1 mark if not specified
    // Simplified negative marking: subtract 1/4 of marksPerQuestion for wrong answers
    // This logic can be made more sophisticated based on actual negativeMarking string from AI.
    let negativeMarkingFactor = 0;
    if (examInfo?.negativeMarking && examInfo.negativeMarking.toLowerCase() !== 'none' && examInfo.negativeMarking.toLowerCase() !== 'no') {
        // Basic check, can be improved to parse "0.25 marks" or "1/4" etc.
        if (examInfo.negativeMarking.includes("1/4") || examInfo.negativeMarking.includes("0.25")) {
            negativeMarkingFactor = 0.25;
        } else if (examInfo.negativeMarking.includes("1/3") || examInfo.negativeMarking.includes("0.33")) {
             negativeMarkingFactor = 1/3;
        }
        // Add more parsing logic if needed
    }
    
    const sectionScore = (sec.correct * marksPerQ) - (sec.wrong * marksPerQ * negativeMarkingFactor);
    const maxSectionScore = sec.total * marksPerQ;
    
    return {
      name: sec.name,
      totalQuestions: sec.total,
      correctAnswers: sec.correct,
      wrongAnswers: sec.wrong,
      skippedAnswers: sec.skipped,
      score: maxSectionScore > 0 ? Math.max(0, (sectionScore / maxSectionScore) * 100) : 0, // Percentage score for section
    };
  });
  
  const totalMarksValue = examInfo?.totalMarks;
  let finalScorePercentage = 0;

  if (totalMarksValue && totalMarksValue > 0) {
    // Calculate score based on total marks if available
    const marksPerQ = examInfo?.marksPerQuestion || (questions.length > 0 ? totalMarksValue / questions.length : 1);
    let negativeMarkingFactor = 0;
     if (examInfo?.negativeMarking && examInfo.negativeMarking.toLowerCase() !== 'none' && examInfo.negativeMarking.toLowerCase() !== 'no') {
        if (examInfo.negativeMarking.includes("1/4") || examInfo.negativeMarking.includes("0.25")) {
            negativeMarkingFactor = 0.25;
        } else if (examInfo.negativeMarking.includes("1/3") || examInfo.negativeMarking.includes("0.33")) {
             negativeMarkingFactor = 1/3;
        }
    }
    const achievedMarks = (totalCorrect * marksPerQ) - (totalWrong * marksPerQ * negativeMarkingFactor);
    finalScorePercentage = (achievedMarks / totalMarksValue) * 100;
  } else if (questions.length > 0) {
    // Fallback to percentage of correct answers if total marks not specified
    finalScorePercentage = (totalCorrect / questions.length) * 100;
  }


  const totalTimeTaken = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

  return {
    totalQuestions: questions.length,
    correctAnswers: totalCorrect,
    wrongAnswers: totalWrong,
    skippedAnswers: totalSkipped,
    finalScore: Math.max(0, parseFloat(finalScorePercentage.toFixed(2))), // Ensure score is not negative
    totalTimeTaken,
    sectionSummaries,
  };
}
