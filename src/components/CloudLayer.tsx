// Persistent full-page background wallpaper: soft, scattered clouds at
// fixed positions across the whole viewport, each gently bobbing in place.
// Rendered once from the root layout (fixed, behind all content) so it
// reads as ambient atmosphere rather than a per-screen effect. aria-hidden
// and pointer-events-none; the global reduced-motion rule collapses the
// bob to a single frame.
const CLOUDS = [
  { top: "4%", left: "8%", size: 46, duration: 7.5, delay: -1.2, opacity: 0.16 },
  { top: "9%", left: "62%", size: 60, duration: 8.8, delay: -3.4, opacity: 0.14 },
  { top: "16%", left: "32%", size: 34, duration: 6.4, delay: -0.5, opacity: 0.13 },
  { top: "22%", left: "85%", size: 42, duration: 7.9, delay: -5.1, opacity: 0.12 },
  { top: "31%", left: "14%", size: 30, duration: 6.9, delay: -2.6, opacity: 0.1 },
  { top: "40%", left: "70%", size: 38, duration: 8.2, delay: -4.4, opacity: 0.11 },
  { top: "52%", left: "40%", size: 26, duration: 6.1, delay: -1.8, opacity: 0.09 },
  { top: "61%", left: "5%", size: 36, duration: 7.3, delay: -3.9, opacity: 0.1 },
  { top: "70%", left: "80%", size: 44, duration: 8.6, delay: -0.9, opacity: 0.12 },
  { top: "82%", left: "24%", size: 28, duration: 6.7, delay: -2.2, opacity: 0.09 },
  { top: "88%", left: "58%", size: 32, duration: 7.1, delay: -4.7, opacity: 0.1 },
];

export function CloudLayer() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {CLOUDS.map((cloud, i) => (
        <span
          key={i}
          className="animate-cloud-bob absolute select-none"
          style={{
            top: cloud.top,
            left: cloud.left,
            fontSize: cloud.size,
            opacity: cloud.opacity,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
          }}
        >
          ☁️
        </span>
      ))}
    </div>
  );
}
