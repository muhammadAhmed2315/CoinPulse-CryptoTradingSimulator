import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// ===== TYPES =====
type CustomTooltipProps = {
  trigger: string;
  content: string;
  triggerStyle?: string;
  contentStyle?: string;
};

export default function CustomTooltip({
  trigger,
  content,
  triggerStyle,
  contentStyle,
}: CustomTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${triggerStyle}`}>{trigger}</span>
        </TooltipTrigger>
        <TooltipContent className={contentStyle}>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
