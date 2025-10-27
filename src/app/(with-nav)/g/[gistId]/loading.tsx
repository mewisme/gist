export default function LoadingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">

      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />
          <div className="h-4 bg-muted animate-pulse rounded w-32" />
          <div className="h-4 bg-muted animate-pulse rounded w-24" />
          <div className="h-4 bg-muted animate-pulse rounded w-20" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted animate-pulse rounded w-16" />
          <div className="h-6 bg-muted animate-pulse rounded w-20" />
          <div className="h-6 bg-muted animate-pulse rounded w-14" />
        </div>
      </div>


      <div className="flex gap-4">
        <div className="h-8 bg-muted animate-pulse rounded w-24" />
        <div className="h-8 bg-muted animate-pulse rounded w-20" />
        <div className="h-8 bg-muted animate-pulse rounded w-28" />
      </div>


      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>


      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-32" />
        {[1, 2].map((i) => (
          <div key={i} className="p-6 bg-muted animate-pulse rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 bg-muted-foreground/20 animate-pulse rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-muted-foreground/20 animate-pulse rounded w-24" />
                <div className="h-3 bg-muted-foreground/20 animate-pulse rounded w-16" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted-foreground/20 animate-pulse rounded w-full" />
              <div className="h-4 bg-muted-foreground/20 animate-pulse rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
