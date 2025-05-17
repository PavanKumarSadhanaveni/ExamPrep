
import type { ExamData, OverallResults, SectionSummary, Question, UserAnswer } from '@/types/exam';

// Define penalty percentages for each hint level
const HINT_PENALTIES = {
  1: 0.10, // 10% for level 1 hint
  2: 0.15, // Additional 15% for level 2 hint
  3: 0.15, // Additional 15% for level 3 hint
};

// Function to calculate the score for a single question considering hints
function calculateQuestionScore(question: Question, userAnswer: UserAnswer | undefined, marksPerQuestion: number): number {
  if (!userAnswer || userAnswer.selectedOption === null) {
    return 0; // Skipped questions get 0 marks
  }

  let score = userAnswer.isCorrect ? marksPerQuestion : 0;

  if (userAnswer.isCorrect && userAnswer.hintsTaken && userAnswer.hintsTaken.length > 0) {
    let totalPenaltyPercentage = 0;
    userAnswer.hintsTaken.forEach(hint => {
      if (hint.level === 1) totalPenaltyPercentage += HINT_PENALTIES[1];
      else if (hint.level === 2) totalPenaltyPercentage += HINT_PENALTIES[2];
      else if (hint.level === 3) totalPenaltyPercentage += HINT_PENALTIES[3];
    });
    // Ensure penalty doesn't exceed 100% of the question's marks
    const penaltyAmount = Math.min(marksPerQuestion, marksPerQuestion * totalPenaltyPercentage);
    score -= penaltyAmount;
  }
  
  // Ensure score doesn't go below zero if incorrect and hints were taken (though hints usually apply to correct answers)
  return Math.max(0, score); 
}


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
      overallRawScore: 0,
      overallMaxScore: 0,
    };
  }

  let totalCorrectAnswersCount = 0;
  let totalWrongAnswersCount = 0;
  let totalSkippedAnswersCount = 0;
  let overallAchievedMarks = 0;
  let overallMaximumMarks = 0;

  const sectionMap: { [key: string]: { 
    name: string, 
    totalQuestions: number, 
    correctAnswers: number, 
    wrongAnswers: number, 
    skippedAnswers: number, 
    achievedMarks: number,
    maximumMarks: number 
  } } = {};

  // Determine default marks per question if not specified at subject/section level
  const defaultMarksPerQuestion = examInfo?.overallTotalMarks && examInfo.overallNumberOfQuestions && examInfo.overallNumberOfQuestions > 0
    ? examInfo.overallTotalMarks / examInfo.overallNumberOfQuestions
    : 1;

  questions.forEach(q => {
    const sectionInfo = examInfo?.subjects
        .flatMap(subj => subj.subjectSections.map(sec => ({...sec, subjectName: subj.subjectName})))
        .find(secDetail => {
            const flatSectionId = examInfo.sections?.find(s => s.includes(secDetail.subjectName) && s.includes(secDetail.sectionNameOrType)) || `${secDetail.subjectName} - ${secDetail.sectionNameOrType}`;
            return flatSectionId === q.section;
        });

    const marksPerThisQuestion = sectionInfo?.marksPerQuestion || defaultMarksPerQuestion;
    
    if (!sectionMap[q.section]) {
      sectionMap[q.section] = { 
        name: q.section, 
        totalQuestions: 0, 
        correctAnswers: 0, 
        wrongAnswers: 0, 
        skippedAnswers: 0,
        achievedMarks: 0,
        maximumMarks: 0
      };
    }
    sectionMap[q.section].totalQuestions++;
    sectionMap[q.section].maximumMarks += marksPerThisQuestion;
    overallMaximumMarks += marksPerThisQuestion;

    const userAnswer = userAnswers.find(ans => ans.questionId === q.id);
    const questionScore = calculateQuestionScore(q, userAnswer, marksPerThisQuestion);
    sectionMap[q.section].achievedMarks += questionScore;
    overallAchievedMarks += questionScore;

    if (!userAnswer || userAnswer.selectedOption === null) {
      totalSkippedAnswersCount++;
      sectionMap[q.section].skippedAnswers++;
    } else if (userAnswer.isCorrect) {
      totalCorrectAnswersCount++;
      sectionMap[q.section].correctAnswers++;
    } else {
      totalWrongAnswersCount++;
      sectionMap[q.section].wrongAnswers++;
    }
  });

  const sectionSummaries: SectionSummary[] = Object.values(sectionMap).map(sec => {
    return {
      name: sec.name,
      totalQuestions: sec.totalQuestions,
      correctAnswers: sec.correctAnswers,
      wrongAnswers: sec.wrongAnswers,
      skippedAnswers: sec.skippedAnswers,
      score: sec.maximumMarks > 0 ? Math.max(0, (sec.achievedMarks / sec.maximumMarks) * 100) : 0,
      rawScore: sec.achievedMarks,
      maxScore: sec.maximumMarks,
    };
  });
  
  const finalScorePercentage = overallMaximumMarks > 0 ? (overallAchievedMarks / overallMaximumMarks) * 100 : 0;
  const totalTimeTaken = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

  return {
    totalQuestions: questions.length,
    correctAnswers: totalCorrectAnswersCount,
    wrongAnswers: totalWrongAnswersCount,
    skippedAnswers: totalSkippedAnswersCount,
    finalScore: Math.max(0, parseFloat(finalScorePercentage.toFixed(2))),
    totalTimeTaken,
    sectionSummaries,
    overallRawScore: overallAchievedMarks,
    overallMaxScore: overallMaximumMarks,
  };
}
