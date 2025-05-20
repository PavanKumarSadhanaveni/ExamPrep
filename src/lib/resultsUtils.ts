
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
      // Ensure hint.level is treated as a key of HINT_PENALTIES
      const levelKey = hint.level as keyof typeof HINT_PENALTIES;
      if (HINT_PENALTIES[levelKey]) {
        totalPenaltyPercentage += HINT_PENALTIES[levelKey];
      }
    });
    // Ensure penalty doesn't exceed 100% of the question's marks
    const penaltyAmount = Math.min(marksPerQuestion, marksPerQuestion * totalPenaltyPercentage);
    score -= penaltyAmount;
  }
  
  // Ensure score doesn't go below zero
  return Math.max(0, score); 
}


export function calculateResults(examData: ExamData): OverallResults {
  const { questions: loadedQuestions, userAnswers, startTime, endTime, examInfo } = examData;

  if (!examInfo || !examInfo.subjects || examInfo.subjects.length === 0) {
    // If no exam structure is defined, return basic empty results or based on loaded questions if any
    const fallbackTotalQuestions = loadedQuestions.length;
    let fallbackCorrect = 0;
    let fallbackWrong = 0;
    let fallbackSkipped = 0;
    let fallbackRawScore = 0;
    const fallbackMaxScore = fallbackTotalQuestions * 1; // Assume 1 mark per question

    loadedQuestions.forEach(q => {
        const ua = userAnswers.find(ans => ans.questionId === q.id);
        if (!ua || ua.selectedOption === null) fallbackSkipped++;
        else if (ua.isCorrect) fallbackCorrect++;
        else fallbackWrong++;
        fallbackRawScore += calculateQuestionScore(q, ua, 1);
    });
    
    return {
      totalQuestions: fallbackTotalQuestions,
      correctAnswers: fallbackCorrect,
      wrongAnswers: fallbackWrong,
      skippedAnswers: fallbackSkipped,
      finalScore: fallbackMaxScore > 0 ? (fallbackRawScore / fallbackMaxScore) * 100 : 0,
      totalTimeTaken: startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0,
      sectionSummaries: [], // No defined sections to summarize
      overallRawScore: fallbackRawScore,
      overallMaxScore: fallbackMaxScore,
    };
  }

  let overallAchievedMarks = 0;
  let overallMaximumMarks = 0;
  let totalCorrectAnswersCount = 0;
  let totalWrongAnswersCount = 0;
  let totalSkippedAnswersCount = 0;
  let overallExpectedQuestions = 0;

  const sectionSummaries: SectionSummary[] = [];

  const defaultMarksPerQuestionFromExam = examInfo.overallTotalMarks && examInfo.overallNumberOfQuestions && examInfo.overallNumberOfQuestions > 0
    ? examInfo.overallTotalMarks / examInfo.overallNumberOfQuestions
    : 1;

  examInfo.subjects.forEach(subject => {
    subject.subjectSections.forEach(sectionDetail => {
      // Determine the unique flat section identifier (e.g., "Physics - Section A")
      // This needs to be consistent with how question.section is stored.
      const sectionPrefix = (examInfo.subjects.length === 1 && (subject.subjectName.toLowerCase().includes("general") || subject.subjectName.toLowerCase().includes("main"))) ? "" : `${subject.subjectName} - `;
      const flatSectionIdentifier = `${sectionPrefix}${sectionDetail.sectionNameOrType}`;
      
      const expectedQuestionsInSection = sectionDetail.numberOfQuestions || 0;
      overallExpectedQuestions += expectedQuestionsInSection;

      const marksPerQuestionInSection = sectionDetail.marksPerQuestion || subject.marksPerQuestion || defaultMarksPerQuestionFromExam;
      const sectionMaximumMarks = (sectionDetail.totalMarksForSection !== undefined && sectionDetail.totalMarksForSection !== null)
        ? sectionDetail.totalMarksForSection
        : expectedQuestionsInSection * marksPerQuestionInSection;
      
      overallMaximumMarks += sectionMaximumMarks;

      let sectionAchievedMarks = 0;
      let sectionCorrect = 0;
      let sectionWrong = 0;
      let sectionAttemptedCount = 0; // Number of questions in this section that were loaded AND answered/skipped by user

      // Filter loaded questions that belong to this specific flatSectionIdentifier
      const questionsInThisSection = loadedQuestions.filter(q => q.section === flatSectionIdentifier);

      questionsInThisSection.forEach(q => {
        const userAnswer = userAnswers.find(ans => ans.questionId === q.id);
        sectionAchievedMarks += calculateQuestionScore(q, userAnswer, marksPerQuestionInSection);

        if (userAnswer && userAnswer.selectedOption !== null) {
          sectionAttemptedCount++;
          if (userAnswer.isCorrect) {
            sectionCorrect++;
          } else {
            sectionWrong++;
          }
        } else {
          // This question was loaded but explicitly skipped by user or timed out before answering
          // We count it as attempted (for the purpose of calculating the section's skipped count from expected)
          sectionAttemptedCount++; 
        }
      });
      
      // Questions defined in examInfo for this section but not found in loadedQuestions NOR in userAnswers for this section
      // OR questions that were loaded but explicitly skipped.
      const sectionSkipped = expectedQuestionsInSection - sectionCorrect - sectionWrong;


      overallAchievedMarks += sectionAchievedMarks;
      totalCorrectAnswersCount += sectionCorrect;
      totalWrongAnswersCount += sectionWrong;
      // totalSkippedAnswersCount is calculated at the end based on overall expected vs overall correct+wrong

      sectionSummaries.push({
        name: flatSectionIdentifier, // Use the unique flat identifier
        totalQuestions: expectedQuestionsInSection,
        correctAnswers: sectionCorrect,
        wrongAnswers: sectionWrong,
        skippedAnswers: sectionSkipped,
        score: sectionMaximumMarks > 0 ? Math.max(0, (sectionAchievedMarks / sectionMaximumMarks) * 100) : 0,
        rawScore: sectionAchievedMarks,
        maxScore: sectionMaximumMarks,
      });
    });
  });

  // Recalculate overall skipped count based on total expected questions
  totalSkippedAnswersCount = overallExpectedQuestions - totalCorrectAnswersCount - totalWrongAnswersCount;
  if (overallMaximumMarks === 0 && overallExpectedQuestions > 0) { // If max marks was 0 but questions existed, assume 1 mark per question for percentage
      overallMaximumMarks = overallExpectedQuestions;
  }


  const finalScorePercentage = overallMaximumMarks > 0 ? (overallAchievedMarks / overallMaximumMarks) * 100 : 0;
  const totalTimeTaken = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

  // If overallExpectedQuestions is 0 but examInfo was present, it means AI failed to get question counts
  // In this rare case, we might fall back to loadedQuestions.length for total, but it's better if AI is robust.
  const finalTotalQuestions = examInfo.overallNumberOfQuestions || overallExpectedQuestions || loadedQuestions.length;


  return {
    totalQuestions: finalTotalQuestions,
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
