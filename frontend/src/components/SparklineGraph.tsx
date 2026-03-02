import { useEffect, useRef } from "react";

/**
 * Draws a sparkline graph on a specified canvas element based on provided data points.
 * The function first clears any previous drawings, checks if data is available,
 * sets the stroke color based on the trend of data (green for upward, red for downward),
 * and then plots each point on the canvas by mapping data values to canvas coordinates.
 *
 * @function drawSparkline
 * @param {Array<number>} data - The array of numerical values to plot as a sparkline.
 * @param {HTMLCanvasElement} canvas - The canvas element on which the sparkline will be drawn.
 */
function drawSparkline(data: number[], canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear previous drawings
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!data || data.length === 0) {
    ctx.fillText("N/A", canvas.width / 2, canvas.height / 2);
    return;
  }

  // Set up the drawing style
  if (data.length === 0) return;

  if (data[0]! > data[data.length - 1]!) {
    ctx.strokeStyle = "#EB5757"; // Line color
  } else {
    ctx.strokeStyle = "#17C671"; // Line color
  }

  ctx.lineWidth = 3;

  // Determine the scale of the graph
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1; // Prevent division by zero (in case all data points are the same)

  // Padding so the line doesn't touch the top/bottom edges
  const paddingY = canvas.height * 0.2;
  const drawableHeight = canvas.height - paddingY * 2;

  // Function to map data points to canvas coordinates
  const scaleX = canvas.width / (data.length - 1 || 1); // Prevent division by zero (in case of empty data)
  const scaleY = drawableHeight / range;

  // Start at the first data point
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - paddingY - (data[0]! - minVal) * scaleY);

  // Draw line to each subsequent point
  data.forEach((val, i) => {
    ctx.lineTo(i * scaleX, canvas.height - paddingY - (val - minVal) * scaleY);
  });

  // Stroke the path
  ctx.stroke();
}

type SparklineGraphProps = {
  data: number[];
};

export default function SparklineGraph({ data }: SparklineGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawSparkline(data, canvas);
  }, [data]);

  return <canvas ref={canvasRef} className="border h-20 w-60" />;
}
