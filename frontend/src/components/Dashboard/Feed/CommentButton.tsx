import { useState } from "react";

function ChatSVG() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

interface CommentButtonProps {
  count: number;
  active: boolean;
  onClick?: () => void;
}

export default function CommentButton({
  count,
  active,
  onClick,
}: CommentButtonProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative cursor-pointer bg-transparent border-none",
        "flex items-center gap-1.5",
        "px-3 py-1.5 rounded-md",
        "text-[13px] font-medium font-sans",
        "transition-all duration-200",
        active
          ? "text-zinc-900"
          : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-500",
      ].join(" ")}
    >
      <ChatSVG />
      {count > 0 && (
        <span className="font-mono text-[12px] font-medium">{count}</span>
      )}
    </button>
  );
}

// ── Demo ────────────────────────────────────────────────────────────────────
// export default function App() {
//   const [active, setActive] = useState(false);
//   const [count] = useState(3);

//   return (
//     <div className="flex items-center justify-center min-h-screen">
//       <CommentButton
//         count={count}
//         active={active}
//         onClick={() => setActive((p) => !p)}
//       />
//     </div>
//   );
// }
