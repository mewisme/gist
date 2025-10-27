export default function LoadingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Edit Gist</h1>

      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Files</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>

      <div className="h-12 bg-muted animate-pulse rounded w-full" />
    </div>
  );
}
