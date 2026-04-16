import { useEffect, useRef } from "react";

type FlickerGridProps = {
  /** Size of each dot in px. Default: 3 */
  squareSize?: number;
  /** Gap between dots in px. Default: 4 */
  gridGap?: number;
  /** Probability of a dot changing opacity per frame. Default: 0.3 */
  flickerChance?: number;
  /** Maximum opacity of each dot. Default: 0.4 */
  maxOpacity?: number;
  /** Dot color as an RGB string e.g. "0,0,0" or "99,102,241". Default: "0,0,0" */
  color?: string;
};

/**
 * FlickerGrid
 *
 * A canvas-based flickering dot grid. Fills its parent container.
 * Wrap it in a relative-positioned element and it'll cover it entirely.
 *
 * Usage:
 *   <div style={{ position: "relative", height: 80 }}>
 *     <FlickerGrid color="99,102,241" maxOpacity={0.25} />
 *     <div style={{ position: "relative", zIndex: 1 }}>Your content</div>
 *   </div>
 */
export default function BannerFlickerGrid({
  squareSize = 3,
  gridGap = 4,
  flickerChance = 0.3,
  maxOpacity = 0.4,
  color = "0,0,0",
}: FlickerGridProps) {
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

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: "10px",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
