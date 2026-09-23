// Seeds one or more days of the 5-question format (each day: a daily_set
// with 5 slots, each a curated multi-answer prompt with a single guess,
// plus one Scripture Bonus). Add new days by importing their SeedDay and
// listing it in DAYS below.
//
// Run with: npx tsx src/lib/scripts/seed.ts
import { createServiceRoleClient } from "../supabase/server";
import { normalizeAnswer } from "../answers/normalize";
import { DAY_01 } from "./content/day01";
import { DAY_02 } from "./content/day02";
import { DAY_03 } from "./content/day03";
import { DAY_04 } from "./content/day04";
import { DAY_05 } from "./content/day05";
import { DAY_06 } from "./content/day06";
import { DAY_07 } from "./content/day07";
import { DAY_08 } from "./content/day08";
import { DAY_09 } from "./content/day09";
import { DAY_10 } from "./content/day10";
import { DAY_11 } from "./content/day11";
import { DAY_12 } from "./content/day12";
import { DAY_13 } from "./content/day13";
import { DAY_14 } from "./content/day14";
import { DAY_15 } from "./content/day15";
import { DAY_16 } from "./content/day16";
import { DAY_17 } from "./content/day17";
import { DAY_18 } from "./content/day18";
import { DAY_19 } from "./content/day19";
import { DAY_20 } from "./content/day20";
import { DAY_21 } from "./content/day21";
import { DAY_22 } from "./content/day22";
import { DAY_23 } from "./content/day23";
import { DAY_24 } from "./content/day24";
import { DAY_25 } from "./content/day25";
import { DAY_26 } from "./content/day26";
import { DAY_27 } from "./content/day27";
import { DAY_28 } from "./content/day28";
import { DAY_29 } from "./content/day29";
import { DAY_30 } from "./content/day30";
import { DAY_31 } from "./content/day31";
import { DAY_32 } from "./content/day32";
import { DAY_33 } from "./content/day33";
import { DAY_34 } from "./content/day34";
import { DAY_35 } from "./content/day35";
import { DAY_36 } from "./content/day36";
import { DAY_37 } from "./content/day37";
import { DAY_38 } from "./content/day38";
import { DAY_39 } from "./content/day39";
import { DAY_40 } from "./content/day40";
import type { SeedDay } from "./content/types";

const DAYS: SeedDay[] = [
  DAY_01,
  DAY_02,
  DAY_03,
  DAY_04,
  DAY_05,
  DAY_06,
  DAY_07,
  DAY_08,
  DAY_09,
  DAY_10,
  DAY_11,
  DAY_12,
  DAY_13,
  DAY_14,
  DAY_15,
  DAY_16,
  DAY_17,
  DAY_18,
  DAY_19,
  DAY_20,
  DAY_21,
  DAY_22,
  DAY_23,
  DAY_24,
  DAY_25,
  DAY_26,
  DAY_27,
  DAY_28,
  DAY_29,
  DAY_30,
  DAY_31,
  DAY_32,
  DAY_33,
  DAY_34,
  DAY_35,
  DAY_36,
  DAY_37,
  DAY_38,
  DAY_39,
  DAY_40,
];

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
          exclusions: answer.exclusions ?? [],
          is_catholic_only: answer.catholicOnly ?? false,
        })
        .select("id")
        .single();

      if (error || !row) throw error ?? new Error(`Failed to insert answer ${answer.canonical}`);
    }
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
  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase.from("daily_sets").select("date");
  const existingDates = new Set((existing ?? []).map((d) => d.date));

  for (const day of DAYS) {
    if (existingDates.has(day.date)) {
      console.log(`Skipping day ${day.dayNumber} (${day.date}) — already seeded`);
      continue;
    }
    await seedDay(day);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
