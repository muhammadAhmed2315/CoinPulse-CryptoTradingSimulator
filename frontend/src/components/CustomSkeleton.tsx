import { Skeleton } from "./ui/skeleton";

type CustomSkeletonProps = {
  className?: string;
};

export default function CustomSkeleton({ className }: CustomSkeletonProps) {
  return <Skeleton className={`bg-gray-200 ${className}`} />;
}
