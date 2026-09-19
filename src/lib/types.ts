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
export type SubmittedAnswerResult = "accepted" | "duplicate" | "invalid";

export type BibleReference = {
  book: string;
  chapterStart: number;
  verseStart?: number;
  chapterEnd?: number;
  verseEnd?: number;
  display: string;
};

export type DailyChallenge = {
  id: string;
  date: string;
  prompt: string;
  instructions: string;
  whatCounts: string;
  durationSeconds: number;
  canonScope: CanonScope;
  answerSetVersion: string;
  dailyGemAnswerId: string | null;
  scriptureBonusId: string | null;
  status: ChallengeStatus;
};

export type DailyChallengeSummary = {
  id: string;
  date: string;
  prompt: string;
  instructions: string;
  whatCounts: string;
  durationSeconds: number;
  canonScope: CanonScope;
  scriptureBonus: {
    id: string;
    displayText: string;
  };
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

export type SubmitAnswerRequest = {
  sessionId: string;
  rawInput: string;
};

export type SubmitAnswerResponse = {
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

export type FoundAnswer = {
  canonicalAnswer: string;
  score: number;
  tier: AnswerTier;
  references: BibleReference[];
  explanation: string;
};

export type MissedAnswer = {
  canonicalAnswer: string;
  score: number;
  tier: AnswerTier;
  references: BibleReference[];
  explanation: string;
};

export type SessionResults = {
  totalScore: number;
  ascentScore: number;
  scriptureBonusScore: number;
  scriptureBonusCorrect: boolean | null;
  acceptedCount: number;
  tierCounts: Record<AnswerTier, number>;
  foundAnswers: FoundAnswer[];
  missedHighValueAnswers: MissedAnswer[];
  dailyGem: (FoundAnswer & { found: boolean }) | null;
  scriptureBonus: {
    displayText: string;
    book: string;
    referenceDisplay: string;
    translation: string;
    contextNote: string;
    bonusPoints: number;
  };
  canonScope: CanonScope;
};
