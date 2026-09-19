import type { ScoreHistogramBucket } from "@/lib/types";

// Single-series magnitude chart (a histogram is one series by
// definition), so no legend — the section heading names what's plotted.
// Bars: capped width, 4px rounded cap, square baseline, one hue, direct
// value labels since there are only a handful of buckets.
export function ScoreHistogram({ buckets }: { buckets: ScoreHistogramBucket[] }) {
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  if (total === 0) {
    return <p className="text-center text-sm text-stone-dark">No scores yet for this range.</p>;
  }

  return (
    <div className="flex h-32 items-end gap-2">
      {buckets.map((b) => {
        const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
        const heightPct = Math.max(4, Math.round((b.count / maxCount) * 100));
        return (
          <div key={b.label} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs tabular-nums text-stone-dark">{b.count > 0 ? `${pct}%` : ""}</span>
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className="w-6 rounded-t bg-gold"
                style={{ height: `${heightPct}%` }}
                aria-label={`${b.label}: ${b.count} player${b.count === 1 ? "" : "s"} (${pct}%)`}
              />
            </div>
            <span className="text-center text-[10px] leading-tight text-stone">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}
