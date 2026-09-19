// Seeds one or more days of the 5-question format (each day: a daily_set
// with 5 slots, each a curated multi-answer prompt with a single guess,
// plus one Scripture Bonus). Add new days by importing their SeedDay and
// listing it in DAYS below.
//
// Run with: npx tsx src/lib/scripts/seed.ts
import { createServiceRoleClient } from "../supabase/server";
import { normalizeAnswer } from "../answers/normalize";
import { DAY_01 } from "./content/day01";
import type { SeedDay } from "./content/types";

const DAYS: SeedDay[] = [DAY_01];

async function seedDay(day: SeedDay) {
  const supabase = createServiceRoleClient();

  const { data: bonus, error: bonusError } = await supabase
    .from("scripture_bonus")
    .insert({
      display_text: day.scriptureBonus.displayText,
      book: day.scriptureBonus.book,
      chapter: day.scriptureBonus.chapter,
      verse_start: day.scriptureBonus.verseStart,
      verse_end: day.scriptureBonus.verseEnd ?? null,
      reference_display: day.scriptureBonus.referenceDisplay,
      translation: day.scriptureBonus.translation,
      licensing_metadata: day.scriptureBonus.licensingMetadata,
      context_note: day.scriptureBonus.contextNote,
      accepted_book_aliases: day.scriptureBonus.acceptedBookAliases,
      difficulty: "easy",
      canon_scope: "protestant-66",
    })
    .select("id")
    .single();

  if (bonusError || !bonus) throw bonusError ?? new Error("Failed to insert scripture bonus");

  const { data: dailySet, error: dailySetError } = await supabase
    .from("daily_sets")
    .insert({
      date: day.date,
      day_number: day.dayNumber,
      scripture_bonus_id: bonus.id,
      status: "published",
    })
    .select("id")
    .single();

  if (dailySetError || !dailySet) throw dailySetError ?? new Error("Failed to insert daily set");

  for (const question of day.questions) {
    const { data: challenge, error: challengeError } = await supabase
      .from("daily_challenges")
      .insert({
        daily_set_id: dailySet.id,
        slot: question.slot,
        prompt: question.prompt,
        instructions: question.instructions,
        what_counts: question.whatCounts,
        duration_seconds: 25,
        canon_scope: "protestant-66",
        answer_set_version: "v1",
      })
      .select("id")
      .single();

    if (challengeError || !challenge) {
      throw challengeError ?? new Error(`Failed to insert question for slot ${question.slot}`);
    }

    let dailyGemAnswerId: string | null = null;

    for (const answer of question.answers) {
      const { data: row, error } = await supabase
        .from("challenge_answers")
        .insert({
          challenge_id: challenge.id,
          answer_set_version: "v1",
          canonical_answer: answer.canonical,
          normalized_answer: normalizeAnswer(answer.canonical),
          aliases: answer.aliases,
          score: answer.score,
          tier: answer.tier,
          references: answer.references,
          explanation: answer.explanation,
          inclusion_notes: answer.inclusionNotes ?? null,
        })
        .select("id")
        .single();

      if (error || !row) throw error ?? new Error(`Failed to insert answer ${answer.canonical}`);
      if (answer.score === 100) dailyGemAnswerId = row.id;
    }

    await supabase
      .from("daily_challenges")
      .update({ daily_gem_answer_id: dailyGemAnswerId })
      .eq("id", challenge.id);
  }

  console.log(
    "Seeded daily set",
    dailySet.id,
    `(day ${day.dayNumber}, ${day.date}) with`,
    day.questions.length,
    "questions"
  );
}

async function seed() {
  for (const day of DAYS) {
    await seedDay(day);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
