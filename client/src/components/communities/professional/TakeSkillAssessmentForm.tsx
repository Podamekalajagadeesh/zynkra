import { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Alert, AlertDescription } from '../../ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { SkillAssessment, SKILL_ASSESSMENTS, SkillAssessmentQuestion } from '../../../lib/types';

interface TakeSkillAssessmentFormProps {
  communityId: string;
  currentUserId: string;
  skillId: string;
  skillName: string;
  onComplete: (assessment: SkillAssessment) => void;
  onCancel: () => void;
}

export const TakeSkillAssessmentForm = ({
  communityId,
  currentUserId,
  skillId,
  skillName,
  onComplete,
  onCancel
}: TakeSkillAssessmentFormProps) => {
  const assessmentData = SKILL_ASSESSMENTS[skillId];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assessmentData) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>No assessment available for this skill yet.</AlertDescription>
        </Alert>
        <Button onClick={onCancel}>Close</Button>
      </div>
    );
  }

  const questions: SkillAssessmentQuestion[] = assessmentData.questions.map((q, idx) => ({
    ...q,
    questionId: `q${idx}`,
    userAnswer: userAnswers[`q${idx}`]
  }));

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const handleAnswer = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const calculateResults = (): { score: number; passed: boolean } => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const userAnswer = userAnswers[`q${idx}`];
      if (userAnswer === q.correctAnswer) {
        correct++;
      }
    });
    const score = (correct / totalQuestions) * 100;
    const passed = score >= 70; // Passing threshold: 70%
    return { score, passed };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { score, passed } = calculateResults();
    const completedAssessment: SkillAssessment = {
      assessmentId: Date.now().toString(),
      skillId,
      skillName,
      score,
      passed,
      completedAt: new Date().toISOString(),
      questions: questions.map((q, idx) => ({
        ...q,
        userAnswer: userAnswers[`q${idx}`]
      }))
    };
    
    setIsSubmitting(false);
    setIsCompleted(true);
    onComplete(completedAssessment);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (isCompleted) {
    const { score, passed } = calculateResults();
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          {passed ? (
            <>
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-xl font-semibold">You Passed!</h3>
              <p className="text-gray-600 dark:text-gray-400">Your score: {score.toFixed(0)}%</p>
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">Your skill has been verified!</p>
            </>
          ) : (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
              <h3 className="mt-4 text-xl font-semibold">You Didn't Pass</h3>
              <p className="text-gray-600 dark:text-gray-400">Your score: {score.toFixed(0)}%</p>
              <p className="mt-2 text-sm text-gray-500">You need at least 70% to pass. You can retake the assessment later.</p>
            </>
          )}
        </div>
        <Button onClick={onCancel} className="w-full">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <span className="text-sm font-medium">{progress.toFixed(0)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={userAnswers[currentQuestion.questionId] || ''}
            onValueChange={(value) => handleAnswer(currentQuestion.questionId, value)}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value={option} id={`${currentQuestion.questionId}-${idx}`} />
                <Label htmlFor={`${currentQuestion.questionId}-${idx}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        {currentQuestionIndex === totalQuestions - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={answeredCount < totalQuestions || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Assessment'
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!userAnswers[currentQuestion.questionId]}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};