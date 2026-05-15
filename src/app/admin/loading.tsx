import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[420px_1fr]">
      <Skeleton className="h-[620px]" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-52" />
        ))}
      </div>
    </div>
  );
}
