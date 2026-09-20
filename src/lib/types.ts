export type CanonScope = "protestant-66" | "catholic-73" | "orthodox" | "custom";
export type ChallengeStatus = "draft" | "review" | "scheduled" | "published" | "archived";
export type AnswerTier =
  | "outer-court"
  | "bronze-altar"
  | "holy-place"
  | "veil"
  | "holy-of-holies"
  | "third-heaven";
export type SubmittedAnswerResult = "accepted" | "invalid";
export type ScriptureBonusGuessLevel = "testament" | "book" | "chapter" | "verse";
export type ScriptureBonusLevel = ScriptureBonusGuessLevel | "skip";
export type Testament = "Old" | "New";

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
  isCatholicOnly: boolean;
  embedding?: number[] | null;
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
  // A close-but-not-exact guess: never auto-scored, only offered for the
  // player to explicitly confirm (resubmitting the suggested text).
  suggestion?: string;
};

export type SubmitBonusRequest =
  | { level: "testament"; testament: Testament }
  | { level: "book"; book: string; forceSubmit?: boolean }
  | { level: "chapter"; book: string; chapter: number; forceSubmit?: boolean }
  | { level: "verse"; book: string; chapter: number; verse: number; forceSubmit?: boolean }
  | { level: "skip" };

// A close-but-not-exact book-name typo doesn't consume the player's one
// guess: the round stays open (final: false) until they either confirm the
// suggestion or explicitly force-submit their original text as final.
export type SubmitBonusResponse =
  | {
      final: true;
      correct: boolean | null;
      level: ScriptureBonusLevel;
      multiplier: number;
      book: string;
      referenceDisplay: string;
      translation: string;
      contextNote: string;
    }
  | { final: false; suggestion: string };

export type RankedAnswer = {
  canonicalAnswer: string;
  score: number;
  tier: AnswerTier;
  explanation: string;
  references: BibleReference[];
  found: boolean;
  isCatholicOnly: boolean;
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
  scriptureBonusMultiplier: number;
  scriptureBonusLevel: ScriptureBonusLevel | null;
  scriptureBonusCorrect: boolean | null;
  questionResults: QuestionResult[];
  scriptureBonus: {
    displayText: string;
    book: string;
    referenceDisplay: string;
    translation: string;
    contextNote: string;
  };
};

export type SubmitFeedbackRequest = {
  message: string;
  sessionId?: string;
  dailySetId?: string;
};

export type AccountMeResponse =
  | { signedIn: false }
  | { signedIn: true; hasProfile: false }
  | { signedIn: true; hasProfile: true; username: string };

export type PlayerStatsHistoryEntry = {
  dayNumber: number;
  date: string;
  score: number;
  multiplier: number;
};

export type PlayerStats = {
  played: number;
  dayStreak: number;
  averageScore: number;
  bestScore: number;
  averageMultiplier: number;
  history: PlayerStatsHistoryEntry[];
};

export type LeaderboardRange = "today" | "week" | "all" | "streaks";

export type LeaderboardEntry = {
  username: string;
  score: number;
  multiplier: number;
};

export type StreakLeaderboardEntry = {
  username: string;
  streak: number;
};

export type ScoreHistogramBucket = {
  label: string;
  count: number;
};

export type LeaderboardResponse =
  | { range: "today" | "week" | "all"; entries: LeaderboardEntry[]; histogram: ScoreHistogramBucket[] }
  | { range: "streaks"; entries: StreakLeaderboardEntry[] };
