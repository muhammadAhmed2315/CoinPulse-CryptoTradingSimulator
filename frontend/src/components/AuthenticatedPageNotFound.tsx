import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FlickeringGrid from "@/components/authentication/FlickeringGrid";
import Terminal from "@/components/Terminal";

export default function AuthenticatedPageNotFound() {
  // ===== STATE VARIABLES =====
  const navigate = useNavigate();
  const location = useLocation();
  const timestampRef = useRef<HTMLSpanElement>(null);
  const sessionId = useMemo(
    () => Math.random().toString(16).slice(2, 10),
    [],
  );

  // ===== EFFECTS =====
  useEffect(() => {
    if (timestampRef.current) {
      timestampRef.current.textContent = new Date()
        .toISOString()
        .replace("T", " ")
        .slice(0, 19);
    }
  }, []);

  return (
    <div className="relative">
      {/* ===== FLICKERING GRID BACKGROUND ===== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FlickeringGrid
          color="rgb(0, 0, 0)"
          backgroundColor="rgb(255, 255, 255)"
          squareSize={4}
          gridGap={6}
          flickerChance={0.3}
          maxOpacity={0.3}
        />
      </div>

      {/* ===== CENTERED TERMINAL ===== */}
      <div className="relative z-10 flex items-center justify-center px-12 py-6 min-h-[calc(100vh-92px)]">
        <Terminal
          theme="dark"
          statusCode={404}
          sessionId={sessionId}
          actions={[
            { label: "Go Back", onClick: () => navigate(-1) },
            {
              label: "Dashboard",
              onClick: () => navigate("/dashboard"),
              primary: true,
            },
          ]}
        >
          <div className="flex gap-3">
            <span className="text-muted-foreground shrink-0">$</span>
            <span>
              <span className="text-[#a1a1aa]">router</span> resolve{" "}
              <span className="text-[#fafafa]">{location.pathname}</span>
            </span>
          </div>

          <div className="h-2" />

          <div className="flex gap-3">
            <span className="text-[#10b981] font-semibold shrink-0">→</span>
            <span>
              <span className="text-[#a1a1aa]">matched_route</span> ={" "}
              <span className="text-[#ef4444] font-semibold">null</span>
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#10b981] font-semibold shrink-0">→</span>
            <span>
              <span className="text-[#a1a1aa]">status_code</span> ={" "}
              <span className="text-[#fafafa] font-semibold">404</span>
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#10b981] font-semibold shrink-0">→</span>
            <span>
              <span className="text-[#a1a1aa]">method</span> ={" "}
              <span className="text-[#fafafa]">GET</span>
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#10b981] font-semibold shrink-0">→</span>
            <span>
              <span className="text-[#a1a1aa]">timestamp</span> ={" "}
              <span className="text-[#fafafa]" ref={timestampRef}>
                —
              </span>
            </span>
          </div>

          <div className="h-2" />

          <div className="flex gap-3">
            <span className="text-[#ef4444] font-semibold shrink-0">✗</span>
            <span>
              <span className="text-[#ef4444] font-semibold">
                PageNotFound:
              </span>{" "}
              no route registered for the requested path
            </span>
          </div>

          <div className="h-2" />

          <div className="flex gap-3">
            <span className="text-muted-foreground shrink-0">#</span>
            <span className="text-[#52525b]">try one of the following:</span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0">&nbsp;</span>
            <span className="text-[#52525b]">
              &nbsp;&nbsp;- /dashboard&nbsp;&nbsp;&nbsp;&nbsp;home, feed,
              portfolio
            </span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0">&nbsp;</span>
            <span className="text-[#52525b]">
              &nbsp;&nbsp;- /my_trades&nbsp;&nbsp;&nbsp;&nbsp;analytics &amp;
              trade history
            </span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0">&nbsp;</span>
            <span className="text-[#52525b]">
              &nbsp;&nbsp;- /top_coins&nbsp;&nbsp;&nbsp;&nbsp;top 100 by market
              cap
            </span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0">&nbsp;</span>
            <span className="text-[#52525b]">
              &nbsp;&nbsp;- /coin_info&nbsp;&nbsp;&nbsp;&nbsp;charts, news,
              reddit
            </span>
          </div>

          <div className="h-2" />

          <div className="flex gap-3">
            <span className="text-muted-foreground shrink-0">$</span>
            <span className="text-[#fafafa]">
              <span className="cursor-blink">▊</span>
            </span>
          </div>
        </Terminal>
      </div>
    </div>
  );
}
