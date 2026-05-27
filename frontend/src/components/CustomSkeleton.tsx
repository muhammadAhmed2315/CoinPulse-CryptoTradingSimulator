import { Skeleton } from "./ui/skeleton";

// ===== TYPES =====
type CustomSkeletonProps = {
  className?: string;
};

export default function CustomSkeleton({ className }: CustomSkeletonProps) {
  return <Skeleton className={`bg-muted ${className}`} />;
}
