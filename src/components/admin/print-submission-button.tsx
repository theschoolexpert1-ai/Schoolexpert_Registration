"use client";

export default function PrintSubmissionButton() {
  return (
    <button className="admin-button print-action" type="button" onClick={() => window.print()}>
      Export to PDF
    </button>
  );
}
