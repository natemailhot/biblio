// Computes and stores the semantic-match embedding for every active
// challenge_answers row that doesn't have one yet (or was embedded under a
// different model). Safe to re-run any time content changes — it only
// touches rows missing embedding/embedding_model for the current model.
//
// Run with: npx tsx src/lib/scripts/backfillEmbeddings.ts
import { createServiceRoleClient } from "../supabase/server";
import { EMBEDDING_MODEL, buildFingerprint, embedFingerprints } from "../answers/embeddings";

const BATCH_SIZE = 20;

async function main() {
  const supabase = createServiceRoleClient();

  const { data: rows, error } = await supabase
    .from("challenge_answers")
    .select("id, canonical_answer, aliases, explanation")
    .eq("active", true)
    .or(`embedding.is.null,embedding_model.neq.${EMBEDDING_MODEL}`);

  if (error) {
    throw new Error(`Could not load answers: ${error.message}`);
  }
  if (!rows || rows.length === 0) {
    console.log("Nothing to backfill — every active answer already has an embedding.");
    return;
  }

  console.log(`Embedding ${rows.length} answers with ${EMBEDDING_MODEL}...`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const fingerprints = batch.map((r) => buildFingerprint(r.canonical_answer, r.aliases ?? [], r.explanation));
    const embeddings = await embedFingerprints(fingerprints);

    for (let j = 0; j < batch.length; j++) {
      const { error: updateError } = await supabase
        .from("challenge_answers")
        .update({ embedding: embeddings[j], embedding_model: EMBEDDING_MODEL })
        .eq("id", batch[j].id);
      if (updateError) {
        console.error(`Failed to store embedding for ${batch[j].canonical_answer}:`, updateError.message);
      }
    }
    console.log(`  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
