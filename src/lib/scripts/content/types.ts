export type SeedReference = {
  book: string;
  chapterStart: number;
  verseStart?: number;
  chapterEnd?: number;
  verseEnd?: number;
  display: string;
};

export type SeedAnswer = {
  canonical: string;
  aliases: string[];
  score: 10 | 20 | 30 | 60 | 85 | 100;
  tier: "outer-court" | "bronze-altar" | "holy-place" | "veil" | "holy-of-holies" | "third-heaven";
  references: SeedReference[];
  explanation: string;
  inclusionNotes?: string;
  // Content from the 7 deuterocanonical/Catholic-canon books, accepted as a
  // valid live answer but grouped separately in the post-round review so
  // the question itself stays framed within the default 66-book canon.
  catholicOnly?: boolean;
};

export type SeedQuestion = {
  slot: number;
  prompt: string;
  instructions: string;
  whatCounts: string;
  answers: SeedAnswer[];
};

export type SeedScriptureBonus = {
  displayText: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  referenceDisplay: string;
  translation: string;
  licensingMetadata: string;
  contextNote: string;
  acceptedBookAliases: string[];
};

export type SeedDay = {
  dayNumber: number;
  date: string;
  scriptureBonus: SeedScriptureBonus;
  questions: SeedQuestion[];
};
