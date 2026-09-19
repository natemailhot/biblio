// Purely decorative, low-opacity clouds drifting across the background of
// the Ascent screen. aria-hidden and pointer-events-none so they never
// interfere with content or screen readers; the global reduced-motion rule
// in globals.css collapses the drift to a single frame for players who
// prefer less motion.
const CLOUDS = [
  { top: "6%", size: 64, duration: 46, delay: -4 },
  { top: "18%", size: 44, duration: 60, delay: -20 },
  { top: "3%", size: 36, duration: 38, delay: -12 },
];

export function CloudLayer() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden">
      {CLOUDS.map((cloud, i) => (
        <span
          key={i}
          className="animate-cloud-drift absolute select-none opacity-30"
          style={{
            top: cloud.top,
            fontSize: cloud.size,
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
