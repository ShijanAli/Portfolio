export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-6 py-20 text-center">
      <p className="text-xl font-medium">{title}</p>
      {description && <p className="mt-2 text-muted">{description}</p>}
    </div>
  );
}
