export default function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-xl font-medium tracking-tight text-[color:var(--foreground)]">
        {title}
      </h2>
    </div>
  );
}
