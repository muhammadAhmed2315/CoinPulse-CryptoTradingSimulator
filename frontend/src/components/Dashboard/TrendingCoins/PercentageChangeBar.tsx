// ===== TYPES =====
type PercentageChangeBarProps = {
  change: number;
};

export default function PercentageChangeBar({
  change,
}: PercentageChangeBarProps) {
  // ===== DERIVED STATE =====
  const widthPercent = Math.min(Math.abs(change), 100);

  // ===== POSITIVE STATE =====
  if (change > 0)
    return (
      <div className="flex w-full h-1 bg-muted rounded-full ">
        <div className="w-full h-1 bg-muted rounded-full"></div>
        <div className=" w-full h-1 bg-muted rounded-full">
          <div
            className="top-0 left-0 h-full bg-[#80c79a] rounded-full"
            style={{ width: `${widthPercent}%` }}
          ></div>
        </div>
      </div>
    );
  // ===== NEGATIVE STATE =====
  else if (change < 0)
    return (
      <div className="flex w-full h-1 bg-muted rounded-full ">
        <div className=" w-full h-1 bg-muted rounded-full">
          <div
            className="top-0 right-0 h-full bg-[#e38888] rounded-full ml-auto"
            style={{ width: `${widthPercent}%` }}
          ></div>
        </div>
        <div className="w-full h-1 bg-muted rounded-full"></div>
      </div>
    );
  // ===== ZERO STATE =====
  else
    return (
      <div className="relative w-full h-1 bg-muted rounded-full">
        <div className="absolute left-1/2 -translate-x-1/2 w-[5%] h-full bg-foreground rounded-full"></div>
      </div>
    );
}
