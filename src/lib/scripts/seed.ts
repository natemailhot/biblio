// Seeds day 1 using the "Example Complete Challenge" from plan.md, plus a
// second sample prompt from the seed-prompts list, so Phase 1 has more than
// one row to exercise matching/duplicate/versioning logic against.
//
// Run with: npx tsx src/lib/scripts/seed.ts
import { createServiceRoleClient } from "../supabase/server";
import { normalizeAnswer } from "../answers/normalize";

async function seed() {
  const supabase = createServiceRoleClient();

  const { data: bonus, error: bonusError } = await supabase
    .from("scripture_bonus")
    .insert({
      display_text: "The Lord is my shepherd; I shall not want.",
      book: "Psalms",
      chapter: 23,
      verse_start: 1,
      reference_display: "Psalm 23:1",
      translation: "World English Bible (public domain)",
      licensing_metadata: "Public domain",
      context_note:
        "Psalm 23 uses the image of a shepherd to express trust in God's guidance and care.",
      accepted_book_aliases: ["psalm", "psalms"],
      bonus_points: 25,
      difficulty: "easy",
      canon_scope: "protestant-66",
    })
    .select("id")
    .single();

  if (bonusError || !bonus) throw bonusError ?? new Error("Failed to insert scripture bonus");

  const { data: challenge, error: challengeError } = await supabase
    .from("daily_challenges")
    .insert({
      date: "2026-10-01",
      prompt: "Name people who spoke directly with God in the Bible.",
      instructions: "Type as many people as you can before time runs out.",
      what_counts:
        "Count named people for whom the biblical text explicitly describes direct speech from God. Count each person once, even if there are multiple encounters. Use the product's defined 66-book canon for this challenge.",
      duration_seconds: 25,
      canon_scope: "protestant-66",
      answer_set_version: "v1",
      scripture_bonus_id: bonus.id,
      status: "published",
    })
    .select("id")
    .single();

  if (challengeError || !challenge) {
    throw challengeError ?? new Error("Failed to insert challenge");
  }

  const answers = [
    {
      canonical: "Moses",
      aliases: ["moshe"],
      score: 10,
      tier: "familiar" as const,
      references: [
        { book: "Exodus", chapterStart: 3, verseStart: 4, verseEnd: 6, display: "Exodus 3:4-6" },
        { book: "Exodus", chapterStart: 33, verseStart: 11, display: "Exodus 33:11" },
      ],
      explanation:
        "God calls Moses from the burning bush and speaks with him repeatedly during Israel's wilderness journey.",
    },
    {
      canonical: "Hagar",
      aliases: [],
      score: 48,
      tier: "deep-cut" as const,
      references: [
        { book: "Genesis", chapterStart: 16, verseStart: 7, verseEnd: 13, display: "Genesis 16:7-13" },
        { book: "Genesis", chapterStart: 21, verseStart: 17, verseEnd: 19, display: "Genesis 21:17-19" },
      ],
      explanation:
        "God meets Hagar in the wilderness, gives her a promise concerning Ishmael, and later hears her son's cry.",
    },
    {
      canonical: "Cain",
      aliases: [],
      score: 70,
      tier: "daily-gem" as const,
      references: [
        { book: "Genesis", chapterStart: 4, verseStart: 6, verseEnd: 15, display: "Genesis 4:6-15" },
      ],
      explanation:
        "After Cain becomes angry, God questions, warns, judges, and marks him for protection.",
    },
    {
      canonical: "Abraham",
      aliases: ["abram"],
      score: 14,
      tier: "familiar" as const,
      references: [{ book: "Genesis", chapterStart: 12, verseStart: 1, display: "Genesis 12:1" }],
      explanation: "Direct divine speech appears throughout Genesis in God's covenant dealings with Abraham.",
    },
    {
      canonical: "Samuel",
      aliases: [],
      score: 22,
      tier: "known" as const,
      references: [{ book: "1 Samuel", chapterStart: 3, verseStart: 1, display: "1 Samuel 3" }],
      explanation: "God calls the boy Samuel by name in the night in 1 Samuel 3.",
    },
    {
      canonical: "Huldah",
      aliases: [],
      score: 58,
      tier: "deep-cut" as const,
      references: [{ book: "2 Kings", chapterStart: 22, display: "2 Kings 22" }],
      explanation: "The prophet Huldah is consulted and delivers the Lord's word in 2 Kings 22.",
    },
  ];

  let dailyGemAnswerId: string | null = null;

  for (const answer of answers) {
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
      })
      .select("id")
      .single();

    if (error || !row) throw error ?? new Error(`Failed to insert answer ${answer.canonical}`);
    if (answer.canonical === "Cain") dailyGemAnswerId = row.id;
  }

  await supabase
    .from("daily_challenges")
    .update({ daily_gem_answer_id: dailyGemAnswerId })
    .eq("id", challenge.id);

  console.log("Seeded challenge", challenge.id, "for date 2026-10-01");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
