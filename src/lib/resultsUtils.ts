
import type { ExamData, OverallResults, SectionSummary, Question, UserAnswer } from '@/types/exam';

// Define penalty percentages for each hint level
// These are penalties applied to the marks of a question if answered correctly after taking a hint.
const HINT_PENALTIES = {
  1: 0.10, // 10% of question marks for level 1 hint
  2: 0.15, // Additional 15% (total 25% with L1) for level 2 hint
  3: 0.15, // Additional 15% (total 40% with L1 & L2) for level 3 hint
};

// Function to calculate the score for a single question considering hints
function calculateQuestionScore(question: Question, userAnswer: UserAnswer | undefined, marksPerQuestion: number): number {
  if (!userAnswer || userAnswer.selectedOption === null) {
    return 0; // Skipped questions get 0 marks
  }

  let score = userAnswer.isCorrect ? marksPerQuestion : 0;

  // Apply hint penalties ONLY if the answer was correct
  if (userAnswer.isCorrect && userAnswer.hintsTaken && userAnswer.hintsTaken.length > 0) {
    let totalPenaltyPercentage = 0;
    // Ensure hints are processed in order of level to apply penalties correctly
    const sortedHints = [...userAnswer.hintsTaken].sort((a, b) => a.level - b.level);
    
    // Calculate cumulative penalty based on the levels of hints taken
    // Level 1 hint: 10% penalty
    // Level 1 + Level 2 hints: 10% + 15% = 25% penalty
    // Level 1 + Level 2 + Level 3 hints: 10% + 15% + 15% = 40% penalty
    if (sortedHints.find(h => h.level === 1)) totalPenaltyPercentage += HINT_PENALTIES[1];
    if (sortedHints.find(h => h.level === 2)) totalPenaltyPercentage += HINT_PENALTIES[2];
    if (sortedHints.find(h => h.level === 3)) totalPenaltyPercentage += HINT_PENALTIES[3];
    
    const penaltyAmount = marksPerQuestion * totalPenaltyPercentage;
    score -= penaltyAmount;
  }
  
  // Ensure score doesn't go below zero
  return Math.max(0, score); 
}


export function calculateResults(examData: ExamData): OverallResults {
  const { questions: loadedQuestions, userAnswers, startTime, endTime, examInfo } = examData;

  if (!examInfo || !examInfo.subjects || examInfo.subjects.length === 0) {
    // Fallback if no proper exam structure is defined
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
        // For fallback, assume 1 mark per question for score calculation
        fallbackRawScore += calculateQuestionScore(q, ua, 1); 
    });
    
    return {
      totalQuestions: fallbackTotalQuestions,
      correctAnswers: fallbackCorrect,
      wrongAnswers: fallbackWrong,
      skippedAnswers: fallbackSkipped,
      finalScore: fallbackMaxScore > 0 ? Math.max(0, (fallbackRawScore / fallbackMaxScore) * 100) : 0,
      totalTimeTaken: startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0,
      sectionSummaries: [], 
      overallRawScore: fallbackRawScore,
      overallMaxScore: fallbackMaxScore,
    };
  }

  let overallAchievedMarks = 0;
  let overallMaximumMarks = 0;
  let totalCorrectAnswersCount = 0;
  let totalWrongAnswersCount = 0;
  let totalExpectedQuestionsFromInfo = 0;

  const sectionSummaries: SectionSummary[] = [];

  // Use overall average marks if specific per-question marks are not available
  const defaultMarksPerQuestionFromExam = 
    (examInfo.overallTotalMarks && examInfo.overallNumberOfQuestions && examInfo.overallNumberOfQuestions > 0)
    ? examInfo.overallTotalMarks / examInfo.overallNumberOfQuestions
    : 1; // Default to 1 mark if no other info

  examInfo.subjects.forEach(subject => {
    subject.subjectSections.forEach(sectionDetail => {
      const sectionPrefix = (examInfo.subjects.length === 1 && (subject.subjectName.toLowerCase().includes("general") || subject.subjectName.toLowerCase().includes("main"))) ? "" : `${subject.subjectName} - `;
      const flatSectionIdentifier = `${sectionPrefix}${sectionDetail.sectionNameOrType}`;
      
      const expectedQuestionsInSection = sectionDetail.numberOfQuestions || 0;
      totalExpectedQuestionsFromInfo += expectedQuestionsInSection;

      // Prioritize sectionDetail.marksPerQuestion, then subject.marksPerQuestion, then exam-wide average/default
      const marksPerQuestionInSection = sectionDetail.marksPerQuestion 
                                        || (subject.subjectSections.length === 1 ? subject.totalMarksForSubject && subject.numberOfQuestionsInSubject ? subject.totalMarksForSubject / subject.numberOfQuestionsInSubject : undefined : undefined) // If only one section, can derive from subject total
                                        || defaultMarksPerQuestionFromExam;
      
      const sectionMaximumMarks = (sectionDetail.totalMarksForSection !== undefined && sectionDetail.totalMarksForSection !== null)
        ? sectionDetail.totalMarksForSection
        : expectedQuestionsInSection * marksPerQuestionInSection;
      
      overallMaximumMarks += sectionMaximumMarks;

      let sectionAchievedMarks = 0;
      let sectionCorrect = 0;
      let sectionWrong = 0;
      
      const questionsInThisSectionFromLoaded = loadedQuestions.filter(q => q.section === flatSectionIdentifier);

      questionsInThisSectionFromLoaded.forEach(q => {
        const userAnswer = userAnswers.find(ans => ans.questionId === q.id);
        sectionAchievedMarks += calculateQuestionScore(q, userAnswer, marksPerQuestionInSection);

        if (userAnswer && userAnswer.selectedOption !== null) {
          if (userAnswer.isCorrect) {
            sectionCorrect++;
          } else {
            sectionWrong++;
          }
        }
        // If userAnswer is undefined or selectedOption is null for a *loaded* question, it's considered skipped *among loaded ones*.
        // The final skipped count for the section will be based on expected vs (correct+wrong).
      });
      
      const sectionSkipped = expectedQuestionsInSection - sectionCorrect - sectionWrong;

      overallAchievedMarks += sectionAchievedMarks;
      totalCorrectAnswersCount += sectionCorrect;
      totalWrongAnswersCount += sectionWrong;

      sectionSummaries.push({
        name: flatSectionIdentifier,
        totalQuestions: expectedQuestionsInSection,
        correctAnswers: sectionCorrect,
        wrongAnswers: sectionWrong,
        skippedAnswers: Math.max(0, sectionSkipped), // Ensure skipped isn't negative
        score: sectionMaximumMarks > 0 ? Math.max(0, (sectionAchievedMarks / sectionMaximumMarks) * 100) : 0,
        rawScore: sectionAchievedMarks,
        maxScore: sectionMaximumMarks,
      });
    });
  });
  
  // If overallMaximumMarks is still 0 but we have expected questions (e.g. AI didn't provide marks info),
  // assign a default of 1 mark per question for percentage calculation.
  if (overallMaximumMarks === 0 && totalExpectedQuestionsFromInfo > 0) {
      overallMaximumMarks = totalExpectedQuestionsFromInfo * defaultMarksPerQuestionFromExam; // Use default
  }
  if (overallMaximumMarks === 0 && loadedQuestions.length > 0 && totalExpectedQuestionsFromInfo === 0) {
      overallMaximumMarks = loadedQuestions.length * defaultMarksPerQuestionFromExam; // Fallback if no info expected questions
      totalExpectedQuestionsFromInfo = loadedQuestions.length;
  }


  const finalScorePercentage = overallMaximumMarks > 0 ? (overallAchievedMarks / overallMaximumMarks) * 100 : 0;
  const totalTimeTaken = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;
  const finalTotalQuestionsCount = examInfo.overallNumberOfQuestions || totalExpectedQuestionsFromInfo || loadedQuestions.length;
  const overallSkippedAnswersCount = Math.max(0, finalTotalQuestionsCount - totalCorrectAnswersCount - totalWrongAnswersCount);

  return {
    totalQuestions: finalTotalQuestionsCount,
    correctAnswers: totalCorrectAnswersCount,
    wrongAnswers: totalWrongAnswersCount,
    skippedAnswers: overallSkippedAnswersCount,
    finalScore: Math.max(0, parseFloat(finalScorePercentage.toFixed(2))),
    totalTimeTaken,
    sectionSummaries,
    overallRawScore: overallAchievedMarks,
    overallMaxScore: overallMaximumMarks,
  };
}
