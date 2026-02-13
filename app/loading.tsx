export default function Loading() {
  return (
    <div className="page-loader min-h-screen w-full">
      <div className="page-loader-backdrop" />
      <div className="page-loader-grid" />
      <div className="page-loader-noise" />

      <div className="page-loader-content">
        <div className="page-loader-orbit" aria-hidden="true">
          <span className="page-loader-ring page-loader-ring-a" />
          <span className="page-loader-ring page-loader-ring-b" />
          <span className="page-loader-core" />
          <span className="page-loader-dot page-loader-dot-a" />
          <span className="page-loader-dot page-loader-dot-b" />
        </div>

        <p className="page-loader-label">Preparing Portfolio Experience</p>
        <div className="page-loader-bar" aria-hidden="true">
          <span className="page-loader-bar-fill" />
        </div>
      </div>
    </div>
  );
}
