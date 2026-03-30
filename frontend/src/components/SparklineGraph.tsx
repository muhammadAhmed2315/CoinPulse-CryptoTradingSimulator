type SparklineGraphProps = {
  data: number[];
};

export default function SparklineGraph({ data }: SparklineGraphProps) {
  const width = 240;
  const height = 64;
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
  const color = positive ? "#16a34a" : "#dc2626";
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
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
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
