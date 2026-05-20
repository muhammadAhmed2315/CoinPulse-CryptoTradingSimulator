import type { ReactNode } from "react";

// ===== TYPES =====
type TerminalTheme = "light" | "dark";

type TerminalAction = {
  label: string;
  onClick: () => void;
  primary?: boolean;
};

type TerminalProps = {
  theme?: TerminalTheme;
  title?: string;
  statusCode?: number;
  sessionId?: string;
  actions?: TerminalAction[];
  className?: string;
  children: ReactNode;
};

// ===== THEME PALETTES =====
const palettes = {
  dark: {
    shell: "bg-[#0a0a0a]",
    border: "border-transparent",
    titleBar: "bg-[#131316] border-b border-[#1f1f23]",
    footer: "bg-[#131316] border-t border-[#1f1f23]",
    titleText: "text-[#71717a]",
    statusText: "text-[#ef4444]",
    statusDot: "bg-[#ef4444]",
    statusGlow: "0 0 6px #ef4444",
    bodyText: "text-[#d4d4d8]",
    footerText: "text-[#71717a]",
    footerEmphasis: "text-[#d4d4d8]",
    footerStrong: "text-[#fafafa]",
    btn: "border-[#2a2a30] bg-transparent text-[#d4d4d8] hover:border-[#52525b] hover:bg-[#1a1a1d]",
    btnPrimary:
      "border-[#fafafa] bg-[#fafafa] text-[#0a0a0a] hover:bg-white",
    scanlineColor: "rgba(255,255,255,0.015)",
  },
  light: {
    shell: "bg-white",
    border: "border border-[#e4e4e7]",
    titleBar: "bg-[#f4f4f5] border-b border-[#e4e4e7]",
    footer: "bg-[#f4f4f5] border-t border-[#e4e4e7]",
    titleText: "text-[#71717a]",
    statusText: "text-[#b91c1c]",
    statusDot: "bg-[#b91c1c]",
    statusGlow: "0 0 6px #b91c1c",
    bodyText: "text-[#3f3f46]",
    footerText: "text-[#71717a]",
    footerEmphasis: "text-[#3f3f46]",
    footerStrong: "text-[#111]",
    btn: "border-[#e4e4e7] bg-white text-[#3f3f46] hover:border-[#71717a] hover:bg-[#fafafa]",
    btnPrimary:
      "border-[#111] bg-[#111] text-white hover:bg-[#27272a] hover:border-[#27272a]",
    scanlineColor: "rgba(0,0,0,0.015)",
  },
} as const;

export default function Terminal({
  theme = "dark",
  title = "router — coinpulse — 80×24",
  statusCode,
  sessionId,
  actions = [],
  className,
  children,
}: TerminalProps) {
  const p = palettes[theme];

  return (
    <div
      className={`w-full max-w-180 rounded-[14px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.18)] relative ${p.shell} ${p.border} ${className ?? ""}`}
    >
      {/* ===== SCANLINE OVERLAY ===== */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${p.scanlineColor} 0, ${p.scanlineColor} 1px, transparent 1px, transparent 3px)`,
        }}
      />

      {/* ===== TITLE BAR ===== */}
      <div
        className={`flex items-center justify-between px-4 py-3 relative z-[1] ${p.titleBar}`}
      >
        <div className="flex gap-1.75">
          <span className="size-3 rounded-full bg-[#ff5f56]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#27c93f]" />
        </div>
        <p
          className={`font-mono text-[12px] tracking-[0.04em] ${p.titleText}`}
        >
          {title}
        </p>
        {statusCode !== undefined ? (
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] ${p.statusText}`}
          >
            <span
              className={`size-1.5 rounded-full animate-pulse ${p.statusDot}`}
              style={{ boxShadow: p.statusGlow }}
            />
            HTTP {statusCode}
          </span>
        ) : (
          <span className="w-16" />
        )}
      </div>

      {/* ===== BODY ===== */}
      <div
        className={`px-5.5 pt-6 pb-7 font-mono text-[13px] leading-[1.7] relative z-[1] ${p.bodyText}`}
      >
        {children}
      </div>

      {/* ===== FOOTER ===== */}
      {(sessionId || actions.length > 0) && (
        <div
          className={`flex items-center justify-between px-[22px] py-3.5 relative z-[1] ${p.footer}`}
        >
          {sessionId ? (
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.06em] ${p.footerText}`}
            >
              coinpulse v1.0.0 ·{" "}
              <span className={p.footerEmphasis}>session</span>{" "}
              <span className={p.footerStrong}>{sessionId}</span>
            </p>
          ) : (
            <span />
          )}
          {actions.length > 0 && (
            <div className="inline-flex gap-2">
              {actions.map((a) => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className={`font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${a.primary ? p.btnPrimary : p.btn}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== BLINKING CURSOR ANIMATION (shared) ===== */}
      <style>{`
        @keyframes blink-cursor { 50% { opacity: 0; } }
        .cursor-blink {
          display: inline-block;
          animation: blink-cursor 1s steps(1) infinite;
        }
      `}</style>
    </div>
  );
}
