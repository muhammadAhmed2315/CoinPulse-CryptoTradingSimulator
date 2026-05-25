import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CustomSkeleton from "@/components/CustomSkeleton";

export default function FeedPostSkeleton() {
  return (
    <Card className="p-6 mb-6 gap-4">
      {/* ===== HEADER ===== */}
      <CardHeader className="p-0">
        <div className="flex gap-4 items-center">
          <CustomSkeleton className="size-12.5 rounded-[10px]" />
          <div className="flex flex-col gap-1.5">
            <CustomSkeleton className="h-4 w-32" />
            <CustomSkeleton className="h-3 w-20" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* ===== TRADE BANNER ===== */}
        <CustomSkeleton className="h-13 w-full rounded-md mb-4" />
        {/* ===== COMMENT ===== */}
        <CustomSkeleton className="h-5 w-3/4" />
      </CardContent>

      <Separator />

      {/* ===== FOOTER ===== */}
      <CardFooter className="p-0 flex justify-end">
        <CustomSkeleton className="h-8 w-16 rounded-md" />
      </CardFooter>
    </Card>
  );
}
