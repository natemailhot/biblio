-- Semantic "did you mean?" fallback: when a guess matches neither an exact
-- answer/alias nor a close typo, we compare it against each candidate
-- answer's precomputed embedding and — only above a confidence threshold —
-- offer it as a suggestion through the same non-destructive confirm flow
-- already used for typos. Never auto-accepted.
--
-- Embeddings are computed offline (at content-authoring time, via
-- src/lib/scripts/backfillEmbeddings.ts) from a "fingerprint" of the
-- canonical answer + aliases + explanation, not just the bare canonical
-- name — the richer text discriminates far better between similar answers
-- in the same question (e.g. two different Moses miracles that both
-- involve a staff).
--
-- Stored as plain jsonb (a float array) rather than pgvector: each
-- question only has a handful of candidate answers, so a per-question
-- linear scan in application code is simpler than standing up an ANN
-- index for a dataset this small.

alter table challenge_answers
  add column embedding jsonb,
  add column embedding_model text;
