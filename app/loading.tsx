export default function Loading() {
  return (
    <div className="page-loader" style={{ minHeight: "100vh" }}>
      <div className="flex flex-col items-center gap-6">
        <div className="page-loader-ring" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--fg-muted)]">
          Loading
        </p>
      </div>
    </div>
  );
}
