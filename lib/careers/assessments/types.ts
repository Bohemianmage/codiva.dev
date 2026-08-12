export const ASSESSMENT_QUESTION_TYPES = ['single', 'multi', 'rank'] as const;
export type AssessmentQuestionType = (typeof ASSESSMENT_QUESTION_TYPES)[number];

export const ASSESSMENT_ATTEMPT_STATUSES = ['started', 'completed', 'expired', 'abandoned'] as const;
export type AssessmentAttemptStatus = (typeof ASSESSMENT_ATTEMPT_STATUSES)[number];

export const ASSESSMENT_EVENT_TYPES = [
  'started',
  'resumed',
  'question_viewed',
  'answered',
  'window_blur',
  'window_focus',
  'submitted',
  'timed_out',
] as const;
export type AssessmentEventType = (typeof ASSESSMENT_EVENT_TYPES)[number];

export type AssessmentOption = {
  key: string;
  label: string;
};

export type AssessmentQuestion = {
  id: string;
  competency: string;
  prompt: string;
  context?: string;
  type: AssessmentQuestionType;
  options: AssessmentOption[];
  /** For single/multi: correct keys. For rank: correct order. */
  correct: string[];
  points: number;
};

export type AssessmentCatalog = {
  key: string;
  title: string;
  intro: string;
  questionCount: number;
  timeLimitSec: number;
  passPct: number;
  questions: AssessmentQuestion[];
};

export type PublicAssessmentQuestion = {
  id: string;
  competency: string;
  prompt: string;
  context?: string;
  type: AssessmentQuestionType;
  options: AssessmentOption[];
  points: number;
};

export type AssessmentAnswers = Record<string, string[]>;
export type AssessmentOptionOrders = Record<string, string[]>;
