export default function AdminLoading() {
  return (
    <main className="school-loading-screen" role="status" aria-live="polite" aria-label="Loading School Expert admin workspace">
      <div className="school-loading-icon" aria-hidden="true">
        <span className="school-loading-monogram">SE</span>
      </div>
      <span className="school-loading-sr">The School Expert is loading. Please wait.</span>
    </main>
  );
}
