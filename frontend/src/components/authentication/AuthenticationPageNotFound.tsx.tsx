import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FlickeringGrid from "./FlickeringGrid";
import Terminal from "@/components/Terminal";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function AuthenticationPageNotFound() {
  useDocumentTitle("Page Not Found | CoinPulse");

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
    <FlickeringGrid color="#ffffff" backgroundColor="#000000">
      <div className="mx-4 w-full max-w-180">
        <Terminal
          theme="light"
          statusCode={404}
          sessionId={sessionId}
          actions={[
            { label: "Go Back", onClick: () => navigate(-1) },
            {
              label: "Login",
              onClick: () => navigate("/login"),
              primary: true,
            },
          ]}
        >
          <div className="flex gap-3">
            <span className="text-[#a1a1aa] shrink-0">$</span>
            <span>
              <span className="text-muted-foreground">router</span> resolve{" "}
              <span className="text-foreground">{location.pathname}</span>
            </span>
          </div>

          <div className="h-2" />

          <div className="flex gap-3">
            <span className="text-[#059669] font-semibold shrink-0">→</span>
            <span>
              <span className="text-muted-foreground">matched_route</span> ={" "}
              <span className="text-[#b91c1c] font-semibold">null</span>
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#059669] font-semibold shrink-0">→</span>
            <span>
              <span className="text-muted-foreground">status_code</span> ={" "}
              <span className="text-foreground font-semibold">404</span>
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#059669] font-semibold shrink-0">→</span>
            <span>
              <span className="text-muted-foreground">method</span> ={" "}
              <span className="text-foreground">GET</span>
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#059669] font-semibold shrink-0">→</span>
            <span>
              <span className="text-muted-foreground">timestamp</span> ={" "}
              <span className="text-foreground" ref={timestampRef}>
                —
              </span>
            </span>
          </div>

          <div className="h-2" />

          <div className="flex gap-3">
            <span className="text-[#b91c1c] font-semibold shrink-0">✗</span>
            <span>
              <span className="text-[#b91c1c] font-semibold">
                PageNotFound:
              </span>{" "}
              no route registered for the requested path
            </span>
          </div>

          <div className="h-2" />

          <div className="flex gap-3">
            <span className="text-[#a1a1aa] shrink-0">#</span>
            <span className="text-[#a1a1aa]">try one of the following:</span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0">&nbsp;</span>
            <span className="text-[#a1a1aa]">
              &nbsp;&nbsp;- /login&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sign
              in to your account
            </span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0">&nbsp;</span>
            <span className="text-[#a1a1aa]">
              &nbsp;&nbsp;- /create_account&nbsp;&nbsp;&nbsp;create a new
              account
            </span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0">&nbsp;</span>
            <span className="text-[#a1a1aa]">
              &nbsp;&nbsp;- /request_password_reset&nbsp;&nbsp;&nbsp;forgot your
              password
            </span>
          </div>

          <div className="h-2" />

          <div className="flex gap-3">
            <span className="text-[#a1a1aa] shrink-0">$</span>
            <span className="text-foreground">
              <span className="cursor-blink">▊</span>
            </span>
          </div>
        </Terminal>
      </div>
    </FlickeringGrid>
  );
}
