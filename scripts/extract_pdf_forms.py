"""Create a versioned text snapshot of the PDF exports for the form renderer."""

import json
from pathlib import Path

from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
records = []
for pdf_path in sorted(root.glob("*.pdf")):
    reader = PdfReader(str(pdf_path))
    records.append(
        {
            "filename": pdf_path.name,
            "pages": [page.extract_text() or "" for page in reader.pages],
        }
    )

output = root / "src" / "data" / "pdf-pages.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
