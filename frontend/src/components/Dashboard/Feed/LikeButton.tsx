import { useState } from "react";
import { Button } from "@/components/ui/button";

// Only keyframes stay in CSS — these can't be expressed with Tailwind utilities
const KEYFRAMES = `
  @keyframes heartPop {
    0%   { transform: scale(1); }
    30%  { transform: scale(1.5) rotate(-8deg); }
    60%  { transform: scale(0.9) rotate(4deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(0.5); opacity: 0.7; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes burstOut {
    0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(calc(-50% + var(--bx)), calc(-50% + var(--by))) scale(0); opacity: 0; }
  }
  @keyframes heartBreak {
    0%   { transform: scale(1) rotate(0deg); }
    15%  { transform: scale(1.3) rotate(0deg); }
    35%  { transform: scale(0.4) rotate(-10deg); }
    55%  { transform: scale(0.9) rotate(5deg); }
    75%  { transform: scale(0.7) rotate(-3deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes shardOut {
    0%   { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    50%  { opacity: 0.9; }
    100% { transform: translate(calc(-50% + var(--sx)), calc(-50% + var(--sy))) scale(0); opacity: 0; }
  }
  @keyframes fadeRing {
    0%   { transform: scale(0.6); opacity: 0.7; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  .heart-anim  { animation: heartPop   0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .heart-break { animation: heartBreak 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  .pulse-ring  { animation: pulseRing  0.5s  ease-out forwards; }
  .fade-ring   { animation: fadeRing   0.55s ease-out forwards; }
  .burst-dot   { animation: burstOut   0.45s ease-out forwards; }
  .shard       { animation: shardOut   0.55s ease-out forwards; }
`;

function HeartSVG({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

type LikeButtonProps = {
  count: number;
  liked: boolean;
  onToggle: () => void;
};

export default function LikeButton({
  liked,
  count,
  onToggle,
}: LikeButtonProps) {
  const [anim, setAnim] = useState<"like" | "unlike" | false>(false);
  const [rings, setRings] = useState<number[]>([]);
  const [dots, setDots] = useState<
    { id: number; a: number; d: number; s: number }[]
  >([]);
  const [shards, setShards] = useState<
    { id: number; a: number; d: number; s: number }[]
  >([]);
  const [fadeRings, setFadeRings] = useState<number[]>([]);

  function click() {
    if (!liked) {
      // ── Like animation ──
      setAnim("like");
      setTimeout(() => setAnim(false), 500);

      setRings((p) => [...p, Date.now()]);
      setTimeout(() => setRings((p) => p.slice(1)), 550);

      setDots(
        Array.from({ length: 8 }, (_, i) => ({
          id: Date.now() + i,
          a: i * 45 + Math.random() * 20 - 10,
          d: 14 + Math.random() * 8,
          s: 2.5 + Math.random() * 2,
        })),
      );
      setTimeout(() => setDots([]), 500);
    } else {
      // ── Unlike animation ──
      setAnim("unlike");
      setTimeout(() => setAnim(false), 600);

      setFadeRings((p) => [...p, Date.now()]);
      setTimeout(() => setFadeRings((p) => p.slice(1)), 600);

      setShards(
        Array.from({ length: 10 }, (_, i) => ({
          id: Date.now() + i,
          a: i * 36 + Math.random() * 15 - 7,
          d: 18 + Math.random() * 10,
          s: 3 + Math.random() * 2.5,
        })),
      );
      setTimeout(() => setShards([]), 600);
    }
    if (onToggle) onToggle();
  }

  return (
    <>
      <style>{KEYFRAMES}</style>
      {/* shadcn ghost Button with colour overrides for liked state */}
      <Button
        variant="ghost"
        onClick={click}
        className={[
          "relative overflow-visible gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors",
          "font-[Space_Grotesk,system-ui,sans-serif] cursor-pointer",
          liked
            ? "text-red-500 hover:bg-red-50 hover:text-red-500"
            : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-500",
        ].join(" ")}
      >
        {/* Pulse ring */}
        {rings.map((r) => (
          <span
            key={r}
            className="pulse-ring absolute left-2.5 top-1/2 -mt-2.5 w-5 h-5 rounded-full border-2 border-red-500 pointer-events-none"
          />
        ))}

        {/* Burst dots (like) */}
        {dots.map((d) => {
          const rad = (d.a * Math.PI) / 180;
          return (
            <span
              key={d.id}
              className="burst-dot absolute left-4.5 top-1/2 rounded-full pointer-events-none bg-red-500"
              style={
                {
                  width: d.s,
                  height: d.s,
                  "--bx": `${Math.cos(rad) * d.d}px`,
                  "--by": `${Math.sin(rad) * d.d}px`,
                } as React.CSSProperties
              }
            />
          );
        })}

        {/* Fade ring (unlike) */}
        {fadeRings.map((r) => (
          <span
            key={r}
            className="fade-ring absolute left-2.5 top-1/2 -mt-3 w-6 h-6 rounded-full border-2 border-red-400 pointer-events-none"
          />
        ))}

        {/* Shards (unlike) */}
        {shards.map((s) => {
          const rad = (s.a * Math.PI) / 180;
          return (
            <span
              key={s.id}
              className="shard absolute left-4.5 top-1/2 rounded-full pointer-events-none bg-red-400"
              style={
                {
                  width: s.s,
                  height: s.s,
                  "--sx": `${Math.cos(rad) * s.d}px`,
                  "--sy": `${Math.sin(rad) * s.d}px`,
                } as React.CSSProperties
              }
            />
          );
        })}

        {/* Heart icon */}
        <span className={`inline-flex ${anim === "like" ? "heart-anim" : anim === "unlike" ? "heart-break" : ""}`}>
          <HeartSVG filled={liked} />
        </span>

        {/* Count */}
        {count > 0 && (
          <span className="font-[IBM_Plex_Mono,monospace]  font-medium">
            {count}
          </span>
        )}
      </Button>
    </>
  );
}

// ── Demo ────────────────────────────────────────────────────────────────────

// export default function App() {
//   const [liked, setLiked] = useState(false);
//   const [count, setCount] = useState(4);

//   function handleToggle() {
//     setLiked((p) => !p);
//     setCount((p) => (liked ? p - 1 : p + 1));
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen">
//       <HeartButton liked={liked} count={count} onToggle={handleToggle} />
//     </div>
//   );
// }
