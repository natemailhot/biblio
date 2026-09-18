# CLAUDE.md

## Project: Scripture Dive

Build **Scripture Dive**, a polished daily Christian Bible knowledge game inspired by the “daily dive” format: players have a short window to name as many valid answers as they can for one Bible-themed prompt. Answers have curated scores based on rarity, clarity, and thematic fit. Every daily game also includes a short **Scripture Bonus**: identify the biblical book from a displayed verse.

The product should feel warm, intelligent, visually beautiful, and welcoming—not preachy, gamified at the expense of reverence, or academically intimidating.

---

## Product Goal

Create a daily habit for people who want to know Scripture more deeply. A typical session should take 2–4 minutes:

1. Play one timed “Dive” prompt.
2. Enter as many valid answers as possible.
3. Complete a bonus “Name the Book” verse challenge.
4. Review a satisfying results page that teaches something small.
5. Share a spoiler-free score card or return tomorrow.

Core positioning:

> A daily game for people who want to know the Bible more deeply—one surprising answer at a time.

---

## Core Experience

### Daily Dive

At a single daily reset time, every player gets the same Bible-themed prompt.

Example prompt:

> Name people who spoke directly with God in the Bible.

The player has **90 seconds** by default to type one answer at a time. Accepted answers appear in a found-answer list with their point values. The player can use an accessibility option that extends or removes the timer, but timed scores should be clearly labeled as a separate mode if needed.

The game is not a conventional multiple-choice quiz. It rewards recall, curiosity, breadth of knowledge, and discovering less-obvious but well-supported answers after the round.

### Scripture Bonus: Name the Book

After the Dive, show one short Scripture passage and ask the player to identify its **book of the Bible** for a bonus.

Example:

> “The Lord is my shepherd; I shall not want.”
>
> Which book is this from?

Answer: Psalms

Requirements:

- Use a short verse or excerpt, generally 8–30 words.
- Ask for the **book**, not the chapter and verse, in the MVP.
- Allow either typed answers with autocomplete or a searchable picker; do not make players type an exact spelling without support.
- Award a fixed bonus for a correct answer, such as 25 points.
- Optionally award a smaller bonus for identifying the correct testament or a close family/category only if the design makes this feel fair.
- After the answer, reveal the full reference, translation name, a one- or two-sentence context note, and a link/interaction to read the surrounding passage.
- Do not reuse the same verse too frequently.
- Keep the bonus separate enough from the Dive that a player who misses it still has a satisfying round.

Suggested bonus card UI:

```text
SCRIPTURE BONUS · +25

“The Lord is my shepherd; I shall not want.”

Which book is this from?

[ Search Bible books…                         ]

[ Submit ]
```

Correct-answer reveal:

```text
Correct — Psalms · Psalm 23:1
+25 points

A psalm of trust that portrays God as a shepherd who provides, guides, and protects.

[ Read Psalm 23 ]
```

---

## Rules and Scoring

### Answer scoring

Each valid answer receives a hand-curated score. Do not calculate scores solely from obscurity; an answer must also be clearly valid and satisfying in relation to the prompt.

Suggested tiers:

| Tier | Score range | Meaning |
|---|---:|---|
| Familiar | 5–15 | An obvious or widely known answer |
| Known | 16–35 | A solid, recognizable answer |
| Deep Cut | 36–65 | Less commonly recalled but clearly valid |
| Daily Gem | 70–100 | Surprising, memorable, and textually well-supported |

Example for “Name people who spoke directly with God in the Bible”:

| Answer | Score | Reference / rationale |
|---|---:|---|
| Moses | 10 | Many direct encounters, including Exodus 3 and Exodus 33 |
| Abraham | 14 | Direct divine speech appears throughout Genesis |
| Samuel | 22 | Called by God in 1 Samuel 3 |
| Hagar | 48 | God speaks to her in Genesis 16 and Genesis 21 |
| Huldah | 58 | Prophet consulted in 2 Kings 22 |
| Cain | 70 | God speaks directly to Cain in Genesis 4 |

### Round total

```text
round score = sum(valid answer scores) + scripture bonus + optional completion bonus
```

Keep the displayed scoring simple. Players should see the points for each answer and an explanation after the round. Avoid a complex hidden formula.

### Score integrity

- Answers must have a clear textual basis in the defined canon/scope.
- Accept common aliases, transliterations, alternate spellings, and reasonable formatting variants.
- Do not penalize capitalization, punctuation, or extra spaces.
- Prevent duplicate answers, including aliases that identify the same person or place.
- When an answer is ambiguous, show a concise explanation after the round.
- Include a “Report a missing answer or issue” affordance on every result screen.
- The content team must be able to revise an answer set without corrupting historical score records.

---

## Content Scope

### MVP canon and transparency

For the MVP, use a clearly documented **66-book Protestant canon** because it provides a bounded, familiar starting scope for an English-language product.

This is a product scope, not a claim that other Christian traditions are invalid or less authoritative. Build the data model to support additional editions and content packs later:

- Catholic / Deuterocanonical content.
- Orthodox traditions and broader canons.
- Early church, saints, councils, and Christian history as separate labeled modes.
- Translation-specific verse packs.

Always label scope when it matters. Do not present denominationally disputed questions as universally settled facts.

### Scripture translation and licensing

Do not ship copyrighted Bible translations without verifying their licenses. Use a properly licensed translation or public-domain text, and store the translation/version metadata with every quote.

Each verse record must include:

- Book.
- Chapter and verse range.
- Exact displayed text.
- Translation/version.
- License/source metadata.
- A concise contextual explanation written for the product.

### Ideal Dive prompts

Prioritize prompts with a finite or reasonably bounded answer set, clear rules, a mix of easy and difficult entries, and citations for every answer.

Good MVP categories:

- People.
- Places.
- Books.
- Prophets and judges.
- Kings and queens.
- Women in Scripture.
- Miracles and healings.
- Biblical objects.
- Animals, foods, and natural features.
- Major events.
- Parables.

Avoid vague or theologically disputed prompts in the MVP, such as:

- “Name Christian virtues.”
- “Things that symbolize faith.”
- “Who was saved?”
- “What is the meaning of…”

### Seed prompts

Create an initial content queue using prompts such as:

1. Name people who received dreams or visions.
2. Name people who spoke with angels.
3. Name women named in the Gospels.
4. Name cities Paul visited in Acts.
5. Name people who interpreted dreams.
6. Name kings of Judah.
7. Name judges of Israel.
8. Name people who were fishermen.
9. Name mountains mentioned in the Bible.
10. Name people imprisoned for their faith.
11. Name people Jesus raised from the dead.
12. Name people whose names changed.
13. Name objects in or associated with the tabernacle.
14. Name prophets who confronted kings.
15. Name people present at Jesus’ crucifixion.
16. Name people associated with the Exodus.
17. Name books traditionally attributed to Paul.
18. Name people mentioned in Hebrews 11.
19. Name foods or meals mentioned in the Gospels.
20. Name places in the Book of Revelation.

Each prompt needs:

- Prompt text.
- A “What counts?” rules panel.
- At least 20 curated valid answers when appropriate.
- Alias lists for every answer.
- Score and rarity tier.
- One or more supporting Bible references.
- A brief educational explanation.
- A designated Daily Gem.
- Editorial notes for edge cases and exclusions.

---

## User Flows

### First visit

1. Show a concise introduction: “One daily Bible challenge. Find as many answers as you can.”
2. Explain that every accepted answer has a source and that deeper answers can score more.
3. Ask the user to begin; do not require account creation before the first game.
4. Offer sign-in only after the result screen to save streaks and history.

### Daily gameplay

1. Show day number, prompt, 90-second timer, current score, answer input, and a collapsible “What counts?” panel.
2. On submission, validate immediately.
3. For valid answers, animate the answer into the found list and show points.
4. For invalid answers, respond kindly: “Not in today’s answer set—try another.” Avoid declaring an answer objectively false unless necessary.
5. End when the timer expires or when the player chooses “Finish.”
6. Transition to the Scripture Bonus.
7. Show full results and learning content.

### Results screen

Show:

- Total score.
- Number of accepted answers.
- Dive score and Scripture Bonus score separately.
- Rarity-tier summary.
- Found answers with points and references.
- Missed high-value answers.
- Daily Gem with a short story or context note.
- Scripture Bonus answer, reference, and contextual note.
- Personal streak and historical best, if signed in.
- Spoiler-free share button.
- “Report a missing answer” feedback button.
- “Come back tomorrow” call to action.

### Share card

Do not reveal the prompt, answers, or verse. Use a compact, friendly result format.

```text
Scripture Dive #042
8 answers · 321 Dive points
Scripture Bonus: ✓ +25

🟦 🟩 🟨 🟪 ⬛

scripturedive.example
```

Use color plus text/icon semantics so the result remains accessible to people with color-vision differences.

---

## Design Direction

### Brand and tone

The game should feel like a thoughtful modern study companion, not a children’s quiz site, casino, or generic devotional app.

Use:

- Warm parchment, stone, ink, deep indigo, olive, and restrained gold accents.
- Elegant readable serif headings paired with a highly legible sans-serif UI font.
- Subtle visual references to manuscripts, maps, margins, illuminated initials, or woodcuts.
- Gentle motion and satisfying answer confirmation.
- Clear, respectful language.

Avoid:

- Excessive religious clip art.
- Fear-based messaging.
- Aggressive countdown effects.
- Overly commercial gamification.
- Language that implies a player’s score measures their faith.

### Accessibility

- Meet WCAG-minded contrast and focus-state standards.
- Make all functionality keyboard accessible.
- Support screen readers with meaningful labels and non-color-only feedback.
- Offer reduced motion.
- Offer a no-timer / extended-timer accessibility mode.
- Use large touch targets on mobile.
- Preserve readability at browser zoom and system font scaling.

---

## Data Model

Use a content-first model. A relational database or structured content store is appropriate.

### `daily_challenges`

```ts
type DailyChallenge = {
  id: string
  date: string // ISO date in the product’s canonical timezone
  prompt: string
  instructions: string
  whatCounts: string
  durationSeconds: number
  canonScope: 'protestant-66' | 'catholic-73' | 'orthodox' | 'custom'
  answerSetVersion: string
  dailyGemAnswerId: string
  scriptureBonusId: string
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived'
}
```

### `challenge_answers`

```ts
type ChallengeAnswer = {
  id: string
  challengeId: string
  canonicalAnswer: string
  normalizedAnswer: string
  aliases: string[]
  score: number
  tier: 'familiar' | 'known' | 'deep-cut' | 'daily-gem'
  references: BibleReference[]
  explanation: string
  inclusionNotes?: string
  exclusions?: string[]
  active: boolean
}

type BibleReference = {
  book: string
  chapterStart: number
  verseStart?: number
  chapterEnd?: number
  verseEnd?: number
  display: string
}
```

### `scripture_bonus`

```ts
type ScriptureBonus = {
  id: string
  displayText: string
  book: string
  chapter: number
  verseStart: number
  verseEnd?: number
  referenceDisplay: string
  translation: string
  licensingMetadata: string
  contextNote: string
  acceptedBookAliases: string[]
  bonusPoints: number
  difficulty: 'easy' | 'medium' | 'hard'
  canonScope: 'protestant-66' | 'catholic-73' | 'orthodox' | 'custom'
}
```

### `game_sessions`

```ts
type GameSession = {
  id: string
  userId?: string
  challengeId: string
  startedAt: string
  completedAt?: string
  mode: 'timed' | 'accessibility'
  submittedAnswers: SubmittedAnswer[]
  diveScore: number
  scriptureBonusAnswer?: string
  scriptureBonusCorrect?: boolean
  scriptureBonusScore: number
  totalScore: number
  answerSetVersion: string
}

type SubmittedAnswer = {
  rawInput: string
  normalizedInput: string
  submittedAtMs: number
  matchedAnswerId?: string
  result: 'accepted' | 'duplicate' | 'invalid'
}
```

---

## Answer Matching

Implement reliable, conservative matching.

1. Normalize casing, punctuation, apostrophes, whitespace, diacritics, and simple possessives.
2. Match exact canonical names and approved aliases first.
3. Support known spelling variants, transliterations, and familiar name equivalents.
4. Use fuzzy matching only to suggest likely intended answers—never silently accept a weak match.
5. If confidence is below a high threshold, ask: “Did you mean **Nebuchadnezzar**?”
6. Preserve raw user input for feedback analysis, subject to privacy policy.
7. Prevent aliases of the same entity from being scored more than once.

Examples of useful alias behavior:

- “Elias” → Elijah.
- “Ozia” / “Uzziah” → a defined canonical entry if the prompt includes him.
- “Sarai” and “Sarah” should either resolve to a single entity or be explicitly distinct only when the prompt’s logic requires it.
- “Saul” and “Paul” should not be treated as duplicate entities in every context; editorial rules must specify the intended interpretation per prompt.

Do not rely on a language model as the final authority for answer validity in production. Validation should come from the curated challenge answer set.

---

## Technical Expectations

Build a responsive web application with a mobile-first experience.

Recommended implementation principles:

- Use TypeScript end to end.
- Keep game content, scoring, and answer validation server-authoritative.
- Do not expose the complete answer set to the client before the round is finished.
- Protect daily challenge endpoints from trivial answer scraping where reasonable.
- Cache public challenge metadata safely, but do not cache unrevealed answers in browser-accessible payloads.
- Use a canonical server time for daily reset and round eligibility.
- Record the answer-set version with every completed session.
- Design the content system so editors can schedule challenges and revise future content without requiring code deployment.
- Add basic analytics for completion rate, accepted/invalid answer rate, bonus success rate, prompt difficulty, and daily retention.
- Keep analytics privacy-conscious; avoid collecting sensitive religious inferences beyond what is required for product operation.

### Anti-cheat basics

This is a friendly learning game, so do not over-engineer anti-cheat. Still:

- Enforce server-side duration validation for timed mode.
- Rate-limit answer submissions.
- Do not send the full answer set to the browser during play.
- Flag impossible submission patterns for review rather than publicly accusing players.
- Make global competition optional, if added at all.

---

## Content Administration

Build or plan for an editor workflow with these stages:

1. Draft a prompt and scope rules.
2. Add candidate answers, aliases, references, explanations, scores, and tiers.
3. Add the Scripture Bonus verse and contextual note.
4. Review source accuracy and denominational sensitivity.
5. Test the prompt with internal players.
6. Schedule it.
7. Publish automatically at daily reset.
8. Monitor feedback and make versioned corrections if warranted.

Editorial quality matters more than quantity. A smaller set of exceptionally well-curated daily challenges is better than a large unreliable archive.

---

## MVP Success Criteria

The first usable release should include:

- A responsive daily challenge page.
- At least 30 scheduled daily Dive challenges.
- At least 30 Scripture Bonus verses.
- Curated answer sets with citations, aliases, tiers, scores, and explanations.
- A 90-second timed mode.
- An optional accessibility timer setting.
- Immediate answer validation.
- A post-game Scripture Bonus asking for the book.
- A results screen with missed-answer learning content.
- Local progress for anonymous players.
- Optional account creation to save streaks and history.
- A spoiler-free share result.
- A content feedback/report flow.
- Clear attribution and licensing metadata for all displayed biblical text.

Do not build initially:

- Global real-time leaderboards.
- Social messaging.
- Unbounded AI-generated question creation.
- Multi-denominational content modes without review workflows.
- Complex monetization.
- Native apps before the web experience is strong.

---

## Initial Build Order

1. Implement the challenge, answer, and Scripture Bonus data models.
2. Build the server-side answer-validation endpoint.
3. Build the timed Dive UI with a local optimistic response plus authoritative server validation.
4. Build the Scripture Bonus UI and book-answer matching.
5. Build the results screen with explanations, references, and Daily Gem.
6. Seed 30 editorially curated challenges and verses.
7. Add anonymous persistence, then accounts/streaks.
8. Add sharing and feedback tools.
9. Test with a small group of Bible readers across levels of familiarity.
10. Refine scoring and content rules based on actual play data.

---

## Example Complete Challenge

```json
{
  "date": "2026-10-01",
  "prompt": "Name people who spoke directly with God in the Bible.",
  "instructions": "Type as many people as you can before time runs out.",
  "whatCounts": "Count named people for whom the biblical text explicitly describes direct speech from God. Count each person once, even if there are multiple encounters. Use the product’s defined 66-book canon for this challenge.",
  "durationSeconds": 90,
  "dailyGemAnswerId": "cain",
  "answers": [
    {
      "canonicalAnswer": "Moses",
      "aliases": ["moshe"],
      "score": 10,
      "tier": "familiar",
      "references": ["Exodus 3:4–6", "Exodus 33:11"],
      "explanation": "God calls Moses from the burning bush and speaks with him repeatedly during Israel’s wilderness journey."
    },
    {
      "canonicalAnswer": "Hagar",
      "aliases": [],
      "score": 48,
      "tier": "deep-cut",
      "references": ["Genesis 16:7–13", "Genesis 21:17–19"],
      "explanation": "God meets Hagar in the wilderness, gives her a promise concerning Ishmael, and later hears her son’s cry."
    },
    {
      "canonicalAnswer": "Cain",
      "aliases": [],
      "score": 70,
      "tier": "daily-gem",
      "references": ["Genesis 4:6–15"],
      "explanation": "After Cain becomes angry, God questions, warns, judges, and marks him for protection."
    }
  ],
  "scriptureBonus": {
    "displayText": "The Lord is my shepherd; I shall not want.",
    "book": "Psalms",
    "referenceDisplay": "Psalm 23:1",
    "translation": "Use a properly licensed or public-domain translation in production.",
    "bonusPoints": 25,
    "contextNote": "Psalm 23 uses the image of a shepherd to express trust in God’s guidance and care."
  }
}
```

---

## Non-Negotiables

- Be accurate, clear, and humble about disputed matters.
- Cite Scripture for every accepted answer and every explanatory claim.
- Make it delightful for beginners without making it shallow for experienced Bible readers.
- Make it accessible and non-punitive.
- Never imply that high scores equal stronger faith.
- Treat Scripture and Christian traditions with respect.
- Prefer curated correctness over AI-generated improvisation.
- Keep the daily experience focused, fast, and rewarding.

