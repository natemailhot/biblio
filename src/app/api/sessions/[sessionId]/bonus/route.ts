import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAnswer } from "@/lib/answers/normalize";
import { isCloseTypo } from "@/lib/answers/fuzzyMatch";
import { getTestamentForBook } from "@/lib/content/bibleBooks";
import {
  BONUS_INCORRECT_MULTIPLIER,
  BONUS_MULTIPLIERS,
  BONUS_SKIP_MULTIPLIER,
} from "@/lib/content/scriptureBonusScoring";
import type { ScriptureBonusLevel, SubmitBonusResponse, Testament } from "@/lib/types";

const VALID_LEVELS: ScriptureBonusLevel[] = ["testament", "book", "chapter", "verse", "skip"];

// Players naturally type a full reference ("John 3:16") into the book
// field even at "book" precision. Strip a trailing chapter[:verse[-verse]]
// pattern so that still resolves to the book name — only the trailing
// occurrence is stripped, so book names that themselves start with a
// number ("1 Samuel", "3 John") are unaffected.
function stripTrailingReference(raw: string): string {
  return raw.replace(/\s+\d+(:\d+(-\d+)?)?\s*$/, "").trim();
}

// Scores the Scripture Bonus as a multiplier on the Ascent score, based on
// how precisely the player guesses the verse's location. The player
// chooses exactly one precision level and gets exactly one real guess — no
// retries — but a close-but-not-exact typo of the book name doesn't
// consume that guess: it comes back as `final: false` with a suggestion,
// and the round only locks once the player confirms (resubmits the
// suggested spelling) or explicitly force-submits their original text. A
// wrong final guess costs a x0.75 penalty; "I don't know" is neutral
// (x1.00). Runs independently of the Ascent timer/duration checks.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await req.json().catch(() => null);
  const level = body?.level as string | undefined;
  const forceSubmit = body?.forceSubmit === true;

  if (!level || !VALID_LEVELS.includes(level as ScriptureBonusLevel)) {
    return NextResponse.json({ error: "A valid level is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, daily_set_id, ascent_score, scripture_bonus_answer")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.scripture_bonus_answer !== null) {
    return NextResponse.json({ error: "Scripture Bonus already answered" }, { status: 409 });
  }

  const { data: dailySet, error: dailySetError } = await supabase
    .from("daily_sets")
    .select("scripture_bonus_id")
    .eq("id", session.daily_set_id)
    .single();

  if (dailySetError || !dailySet?.scripture_bonus_id) {
    return NextResponse.json({ error: "Daily set has no Scripture Bonus" }, { status: 404 });
  }

  const { data: bonus, error: bonusError } = await supabase
    .from("scripture_bonus")
    .select(
      "book, chapter, verse_start, verse_end, reference_display, translation, context_note, accepted_book_aliases, canon_scope, display_text"
    )
    .eq("id", dailySet.scripture_bonus_id)
    .single();

  if (bonusError || !bonus) {
    return NextResponse.json({ error: "Scripture Bonus not found" }, { status: 404 });
  }

  let correct: boolean | null = null;
  let multiplier = BONUS_SKIP_MULTIPLIER;
  let answerDisplay = "I don't know";

  if (level !== "skip") {
    const acceptedBooks = [bonus.book, ...(bonus.accepted_book_aliases ?? [])];
    const acceptedBooksNormalized = acceptedBooks.map(normalizeAnswer);
    const actualTestament = getTestamentForBook(bonus.canon_scope, bonus.book);

    if (level === "testament") {
      const testament = body?.testament as Testament | undefined;
      if (testament !== "Old" && testament !== "New") {
        return NextResponse.json({ error: "testament must be 'Old' or 'New'" }, { status: 400 });
      }
      correct = actualTestament !== null && testament === actualTestament;
      answerDisplay = `${testament} Testament`;
    } else {
      const book = body?.book as string | undefined;
      if (!book || !book.trim()) {
        return NextResponse.json({ error: "book is required" }, { status: 400 });
      }
      const strippedBook = stripTrailingReference(book);
      const bookMatches =
        acceptedBooksNormalized.includes(normalizeAnswer(book)) ||
        acceptedBooksNormalized.includes(normalizeAnswer(strippedBook));

      if (!bookMatches && !forceSubmit) {
        const closeTypo =
          isCloseTypo(normalizeAnswer(book), acceptedBooks) ||
          isCloseTypo(normalizeAnswer(strippedBook), acceptedBooks);
        if (closeTypo) {
          const pending: SubmitBonusResponse = { final: false, suggestion: bonus.book };
          return NextResponse.json(pending);
        }
      }

      if (level === "book") {
        correct = bookMatches;
        answerDisplay = book;
      } else if (level === "chapter") {
        const chapter = Number(body?.chapter);
        if (!Number.isInteger(chapter)) {
          return NextResponse.json({ error: "chapter is required" }, { status: 400 });
        }
        correct = bookMatches && chapter === bonus.chapter;
        answerDisplay = `${book} ${chapter}`;
      } else {
        const chapter = Number(body?.chapter);
        const verse = Number(body?.verse);
        if (!Number.isInteger(chapter) || !Number.isInteger(verse)) {
          return NextResponse.json({ error: "chapter and verse are required" }, { status: 400 });
        }
        const verseInRange = verse >= bonus.verse_start && verse <= (bonus.verse_end ?? bonus.verse_start);
        correct = bookMatches && chapter === bonus.chapter && verseInRange;
        answerDisplay = `${book} ${chapter}:${verse}`;
      }
    }

    multiplier = correct
      ? BONUS_MULTIPLIERS[level as keyof typeof BONUS_MULTIPLIERS]
      : BONUS_INCORRECT_MULTIPLIER;
  }

  const totalScore = Math.round(session.ascent_score * multiplier);

  await supabase
    .from("game_sessions")
    .update({
      scripture_bonus_answer: answerDisplay,
      scripture_bonus_correct: correct,
      scripture_bonus_multiplier: multiplier,
      scripture_bonus_level: level,
      total_score: totalScore,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  const response: SubmitBonusResponse = {
    final: true,
    correct,
    level: level as ScriptureBonusLevel,
    multiplier,
    book: bonus.book,
    referenceDisplay: bonus.reference_display,
    translation: bonus.translation,
    contextNote: bonus.context_note,
  };

  return NextResponse.json(response);
}
