// Seeds day 1 using the "Example Complete Challenge" from plan.md, expanded
// with a fuller curated answer set across all six ascent tiers.
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
      tier: "outer-court" as const,
      references: [
        { book: "Exodus", chapterStart: 3, verseStart: 4, verseEnd: 6, display: "Exodus 3:4-6" },
        { book: "Exodus", chapterStart: 33, verseStart: 11, display: "Exodus 33:11" },
      ],
      explanation:
        "God calls Moses from the burning bush and speaks with him repeatedly during Israel's wilderness journey.",
    },
    {
      canonical: "Abraham",
      aliases: ["abram"],
      score: 10,
      tier: "outer-court" as const,
      references: [{ book: "Genesis", chapterStart: 12, verseStart: 1, display: "Genesis 12:1" }],
      explanation:
        "Direct divine speech appears throughout Genesis in God's covenant dealings with Abraham.",
    },
    {
      canonical: "Samuel",
      aliases: [],
      score: 20,
      tier: "bronze-altar" as const,
      references: [{ book: "1 Samuel", chapterStart: 3, verseStart: 1, display: "1 Samuel 3" }],
      explanation: "God calls the boy Samuel by name in the night in 1 Samuel 3.",
    },
    {
      canonical: "Jacob",
      aliases: ["israel"],
      score: 20,
      tier: "bronze-altar" as const,
      references: [
        { book: "Genesis", chapterStart: 28, verseStart: 13, display: "Genesis 28:13" },
        { book: "Genesis", chapterStart: 46, verseStart: 2, display: "Genesis 46:2" },
      ],
      explanation:
        "God speaks to Jacob at Bethel and again in a night vision on the way to Egypt.",
      inclusionNotes:
        "Counted once under his birth name Jacob, even though the text later renames him Israel.",
    },
    {
      canonical: "Solomon",
      aliases: [],
      score: 20,
      tier: "bronze-altar" as const,
      references: [{ book: "1 Kings", chapterStart: 3, verseStart: 5, display: "1 Kings 3:5" }],
      explanation: "The LORD appears to Solomon in a dream at Gibeon and speaks with him directly.",
    },
    {
      canonical: "Elijah",
      aliases: ["elias"],
      score: 30,
      tier: "holy-place" as const,
      references: [{ book: "1 Kings", chapterStart: 19, verseStart: 9, verseEnd: 18, display: "1 Kings 19:9-18" }],
      explanation:
        "On Mount Horeb, after the wind, earthquake, and fire, God speaks to Elijah in a still, small voice.",
    },
    {
      canonical: "Isaiah",
      aliases: [],
      score: 30,
      tier: "holy-place" as const,
      references: [{ book: "Isaiah", chapterStart: 6, verseStart: 1, verseEnd: 8, display: "Isaiah 6:1-8" }],
      explanation:
        "In his temple vision, Isaiah hears the Lord ask, \"Whom shall I send?\" and answers directly.",
    },
    {
      canonical: "Job",
      aliases: [],
      score: 30,
      tier: "holy-place" as const,
      references: [{ book: "Job", chapterStart: 38, verseStart: 1, display: "Job 38:1" }],
      explanation: "God answers Job out of the whirlwind after Job's long complaint.",
    },
    {
      canonical: "Hagar",
      aliases: [],
      score: 60,
      tier: "veil" as const,
      references: [
        { book: "Genesis", chapterStart: 16, verseStart: 7, verseEnd: 13, display: "Genesis 16:7-13" },
        { book: "Genesis", chapterStart: 21, verseStart: 17, verseEnd: 19, display: "Genesis 21:17-19" },
      ],
      explanation:
        "God meets Hagar in the wilderness, gives her a promise concerning Ishmael, and later hears her son's cry.",
    },
    {
      canonical: "Balaam",
      aliases: [],
      score: 60,
      tier: "veil" as const,
      references: [{ book: "Numbers", chapterStart: 22, verseStart: 9, verseEnd: 12, display: "Numbers 22:9-12" }],
      explanation:
        "God speaks directly to Balaam, a non-Israelite prophet-for-hire, warning him about Balak's request.",
    },
    {
      canonical: "Jesus",
      aliases: ["jesus christ", "christ", "yeshua"],
      score: 60,
      tier: "veil" as const,
      references: [
        { book: "Matthew", chapterStart: 3, verseStart: 17, display: "Matthew 3:17" },
        { book: "Matthew", chapterStart: 26, verseStart: 39, display: "Matthew 26:39" },
      ],
      explanation:
        "The Father's voice addresses Jesus directly at his baptism, and Jesus prays directly to the Father in Gethsemane.",
      inclusionNotes:
        "Included for the Gospels' accounts of two-way address between Jesus and the Father — not a claim about the nature of the Trinity, which this game doesn't adjudicate.",
    },
    {
      canonical: "Huldah",
      aliases: [],
      score: 85,
      tier: "holy-of-holies" as const,
      references: [{ book: "2 Kings", chapterStart: 22, display: "2 Kings 22" }],
      explanation: "The prophet Huldah is consulted and delivers the Lord's word in 2 Kings 22.",
    },
    {
      canonical: "Cain",
      aliases: [],
      score: 100,
      tier: "third-heaven" as const,
      references: [
        { book: "Genesis", chapterStart: 4, verseStart: 6, verseEnd: 15, display: "Genesis 4:6-15" },
      ],
      explanation:
        "After Cain becomes angry, God questions, warns, judges, and marks him for protection.",
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
        inclusion_notes: "inclusionNotes" in answer ? answer.inclusionNotes : null,
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

  console.log("Seeded challenge", challenge.id, "for date 2026-10-01 with", answers.length, "answers");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
