import { Skeleton } from "@/components/ui/skeleton";

type PageSkeletonProps = {
  titleWidth?: string;
  subtitleWidth?: string;
  cardCount?: number;
  showLargePanel?: boolean;
  showSidePanel?: boolean;
};

export function PageSkeleton({
  titleWidth = "w-[320px]",
  subtitleWidth = "w-[420px]",
  cardCount = 3,
  showLargePanel = true,
  showSidePanel = true,
}: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <Skeleton className={`h-14 max-w-full ${titleWidth}`} />
        <Skeleton className={`h-5 max-w-full ${subtitleWidth}`} />
      </div>

      <div className={`grid gap-5 md:grid-cols-${Math.min(cardCount, 3)}`}>
        {Array.from({ length: cardCount }).map((_, index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>

      {showLargePanel ? (
        <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <Skeleton className="h-105" />
          {showSidePanel ? <Skeleton className="h-105" /> : null}
        </div>
      ) : null}
    </div>
  );
}