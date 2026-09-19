export type CanonScope = "protestant-66" | "catholic-73" | "orthodox" | "custom";
export type ChallengeStatus = "draft" | "review" | "scheduled" | "published" | "archived";
export type AnswerTier =
  | "outer-court"
  | "bronze-altar"
  | "holy-place"
  | "veil"
  | "holy-of-holies"
  | "third-heaven";
export type SessionMode = "timed" | "accessibility";
export type SubmittedAnswerResult = "accepted" | "invalid";

export type BibleReference = {
  book: string;
  chapterStart: number;
  verseStart?: number;
  chapterEnd?: number;
  verseEnd?: number;
  display: string;
};

export type ChallengeAnswer = {
  id: string;
  challengeId: string;
  answerSetVersion: string;
  canonicalAnswer: string;
  normalizedAnswer: string;
  aliases: string[];
  score: number;
  tier: AnswerTier;
  references: BibleReference[];
  explanation: string;
  inclusionNotes?: string | null;
  exclusions: string[];
  active: boolean;
};

export type ScriptureBonus = {
  id: string;
  displayText: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number | null;
  referenceDisplay: string;
  translation: string;
  licensingMetadata: string;
  contextNote: string;
  acceptedBookAliases: string[];
  bonusPoints: number;
  difficulty: "easy" | "medium" | "hard";
  canonScope: CanonScope;
};

// A single one-guess question within a daily set. Public-safe: never
// carries the answer set.
export type DailyQuestionSummary = {
  id: string;
  slot: number;
  prompt: string;
  instructions: string;
  whatCounts: string;
  durationSeconds: number;
};

// The full day: 5 questions plus the Scripture Bonus. Public-safe.
export type DailySetSummary = {
  id: string;
  dayNumber: number;
  date: string;
  questions: DailyQuestionSummary[];
  scriptureBonus: {
    id: string;
    displayText: string;
    canonScope: CanonScope;
  };
};

export type StartQuestionResponse = {
  startedAt: string;
};

export type SubmitQuestionAnswerResponse = {
  result: SubmittedAnswerResult;
  score: number;
  canonicalAnswer?: string;
  tier?: AnswerTier;
  message: string;
};

export type SubmitBonusResponse = {
  correct: boolean;
  score: number;
  book: string;
  referenceDisplay: string;
  translation: string;
  contextNote: string;
};

export type RankedAnswer = {
  canonicalAnswer: string;
  score: number;
  tier: AnswerTier;
  explanation: string;
  references: BibleReference[];
  found: boolean;
};

// One question's outcome for the results screen: the player's final guess
// (their correct one, or their last attempt if they never got it), how many
// guesses it took, and the full answer set ranked highest score first for
// on-demand review.
export type QuestionResult = {
  slot: number;
  prompt: string;
  guess: string;
  result: SubmittedAnswerResult;
  score: number;
  canonicalAnswer?: string;
  tier?: AnswerTier;
  explanation?: string;
  references?: BibleReference[];
  isDailyGem: boolean;
  guessCount: number;
  allAnswers: RankedAnswer[];
};

export type SessionResults = {
  dayNumber: number;
  totalScore: number;
  ascentScore: number;
  scriptureBonusScore: number;
  scriptureBonusCorrect: boolean | null;
  questionResults: QuestionResult[];
  scriptureBonus: {
    displayText: string;
    book: string;
    referenceDisplay: string;
    translation: string;
    contextNote: string;
    bonusPoints: number;
  };
};
