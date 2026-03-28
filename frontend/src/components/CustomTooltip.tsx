import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

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
        <TooltipTrigger className={`${triggerStyle} cursor-pointer`}>
          {trigger}
        </TooltipTrigger>
        <TooltipContent className={contentStyle}>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
