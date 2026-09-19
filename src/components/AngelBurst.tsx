// A brief burst of small angel/sparkle glyphs rising and fading, triggered
// once when the player clicks "Ascend". Purely decorative (aria-hidden);
// unmounts itself via the caller after the animation window.
const PARTICLES = [
  { emoji: "👼", left: "20%", delay: 0 },
  { emoji: "✨", left: "45%", delay: 80 },
  { emoji: "🪶", left: "68%", delay: 40 },
  { emoji: "✨", left: "82%", delay: 140 },
];

export function AngelBurst() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-visible">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-angel-rise absolute bottom-0 select-none text-xl"
          style={{ left: p.left, animationDelay: `${p.delay}ms` }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
