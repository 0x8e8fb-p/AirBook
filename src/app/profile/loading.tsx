export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-14">
      <div
        role="status"
        aria-label="Loading"
        className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-[var(--accent-primary)]"
      />
    </div>
  );
}

