import { useEffect, useRef } from "react";

type ProfileAvatarProps = {
  letter: string;
  size?: number;
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  maxOpacity?: number;
  color?: string;
};

export default function ProfileAvatar({
  letter,
  size = 60,
  squareSize = 2,
  gridGap = 2,
  flickerChance = 1,
  maxOpacity = 0.5,
  color = "255,255,255",
}: ProfileAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;

    interface Params {
      cols: number;
      rows: number;
      squares: Float32Array;
      dpr: number;
      offsetX: number;
      offsetY: number;
    }

    function setup(): Params {
      const dpr = window.devicePixelRatio || 1;
      const w = container!.offsetWidth;
      const h = container!.offsetHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";

      const cellW = squareSize + gridGap;
      const cols = Math.max(1, Math.floor((w + gridGap) / cellW));
      const rows = Math.max(1, Math.floor((h + gridGap) / cellW));
      const usedW = cols * squareSize + (cols - 1) * gridGap;
      const usedH = rows * squareSize + (rows - 1) * gridGap;
      const offsetX = (w - usedW) / 2;
      const offsetY = (h - usedH) / 2;
      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }
      return { cols, rows, squares, dpr, offsetX, offsetY };
    }

    let params: Params = setup();

    function draw(time: number): void {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const { cols, rows, squares, dpr, offsetX, offsetY } = params;

      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * dt) {
          squares[i] = Math.random() * maxOpacity;
        }
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          ctx!.fillStyle = `rgba(${color},${squares[i * rows + j]})`;
          ctx!.fillRect(
            (offsetX + i * (squareSize + gridGap)) * dpr,
            (offsetY + j * (squareSize + gridGap)) * dpr,
            squareSize * dpr,
            squareSize * dpr,
          );
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      params = setup();
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [squareSize, gridGap, flickerChance, maxOpacity, color]);

  const displayLetter = (letter?.[0] ?? "?").toUpperCase();

  return (
    <div
      ref={containerRef}
      className="relative flex-shrink-0 overflow-hidden rounded-[10px] select-none"
      style={{
        width: size,
        height: size,
        background: "#0a0a0b",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.18)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
      />
      <span
        className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center font-semibold leading-none text-[#fafafa]"
        style={{ fontSize: size * 0.5, letterSpacing: "-0.02em" }}
      >
        {displayLetter}
      </span>
    </div>
  );
}
