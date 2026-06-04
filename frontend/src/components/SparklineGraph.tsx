// ===== TYPES =====
type SparklineGraphProps = {
  data: number[];
  height?: number;
  width?: number;
};

export default function SparklineGraph({
  data,
  height = 64,
  width = 240,
}: SparklineGraphProps) {
  // ===== INSUFFICIENT-DATA GUARD =====
  // With <2 points there is no range to plot: 0 points makes Math.min/max
  // Infinity and 1 point makes i/(length-1) divide by zero. Show a message
  // instead of rendering a broken graph.
  if (data.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ display: "block" }}
      >
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fill="#9ca3af"
        >
          Not enough data to render sparkline
        </text>
      </svg>
    );
  }

  // ===== DERIVED STATE =====
  const positive = data.length > 0 ? data.at(0)! < data.at(-1)! : true;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height * 0.85 - height * 0.075}`,
    )
    .join(" ");
  const color = positive ? "#21c45d" : "#ef4444";
  const gradId = positive ? "sparkGrad_g" : "sparkGrad_r";
  const lastX = width;
  const lastY =
    height -
    ((data[data.length - 1] - min) / range) * height * 0.85 -
    height * 0.075;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: "block" }}
    >
      {/* ===== GRADIENT DEFS ===== */}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* ===== AREA FILL ===== */}
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#${gradId})`}
      />
      {/* ===== LINE ===== */}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ===== END DOT ===== */}
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
      {/* ===== PULSE RING ===== */}
      <circle cx={lastX} cy={lastY} r="6" fill={color} opacity="0.15">
        <animate
          attributeName="r"
          values="4;8;4"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.2;0.05;0.2"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
