const pulseKeyframes = `
  @keyframes pillPulse {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.2); }
  }
`;

type TradePillProps = {
  side: "BUY" | "SELL";
};

export default function TradePill({ side }: TradePillProps) {
  const isBuy = side === "BUY";

  return (
    <>
      <style>{pulseKeyframes}</style>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-widest text-white uppercase ${
          isBuy ? "bg-emerald-500" : "bg-rose-500"
        }`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0"
          style={{ animation: "pillPulse 2s ease-in-out infinite" }}
        />
        {side}
      </span>
    </>
  );
}
