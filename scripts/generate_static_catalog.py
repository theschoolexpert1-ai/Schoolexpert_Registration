"""Generate the checked-in catalog used by the UI and database seed.

This is an import utility only. The running application never reads PDF text.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTES = [
    ("alternative-school", "The School Expert - Alternative School Registration Form (India)", "Alternative School"),
    ("inclusive-school", "The School Expert - Inclusive School Registration Form", "Inclusive School"),
    ("preschool", "The School Expert - Nursery / Preschool Registration Form (India)", "Nursery _ Preschool"),
    ("special-school", "The School Expert - Special School Registration Form (India)", "Special School"),
    ("edtech-company", "THE SCHOOL EXPERT EDTECH COMPANY REGISTRATION FORM", "EDTECH COMPANY"),
    ("educational-publisher", "THE SCHOOL EXPERT Educational Publisher Registration", "Educational Publisher"),
    ("behaviour-consultant", "THE SCHOOL EXPERT K-12 Behaviour Consultant Registration", "Behaviour Consultant"),
    ("career-guidance", "THE SCHOOL EXPERT K-12 Career Guidance & Counselling Provider - Public Listing Profile", "Career Guidance"),
    ("course-provider", "THE SCHOOL EXPERT K-12 Individual Course Providers", "Individual Course"),
    ("mental-health", "THE SCHOOL EXPERT K-12 Mental Health Professionals - Registration", "Mental Health"),
    ("infrastructure-vendor", "THE SCHOOL EXPERT K-12 School Infrastructure Vendor Registration", "Infrastructure Vendor"),
    ("transport-logistics", "THE SCHOOL EXPERT K-12 Transportation & Logistics Providers - Registration", "Transportation"),
    ("uniform-vendor", "THE SCHOOL EXPERT K-12 Uniform, Badge, Bag & Stationery Vendor Registration", "Uniform, Badge"),
    ("skill-development", "THE SCHOOL EXPERT Skill Development Institute - K-12 Registration", "Skill Development Institute"),
]

def clean(line):
    return re.sub(r"\s+", " ", line).replace("�", "").strip()

def useful(line):
    return line and not re.match(r"^(This content|\d{2}/\d{2}/\d{4}|https?://|[\sFo r m s]+$)", line)

def input_type(label):
    value = label.lower()
    if "email" in value: return "email"
    if any(word in value for word in ("phone", "mobile", "whatsapp")): return "phone"
    if any(word in value for word in ("website", "link", "url")): return "url"
    if "date" in value: return "date"
    if any(word in value for word in ("year", "number", "count", "strength", "ratio", "area", "fee", "price")): return "number"
    return None

def kind(block):
    text = " ".join(block)
    if "Files submitted:" in text: return "file"
    if "Tick all that apply." in text: return "checkbox"
    if "Dropdown" in text: return "select"
    if "Mark only one oval." in text: return "radio"
    return "text"

def parse_page(page, slug, page_number):
    lines = [clean(line) for line in page.splitlines()]
    lines = [line for line in lines if useful(line)]
    starts = [index for index, line in enumerate(lines) if re.fullmatch(r"\d+\.", line)]
    if not starts: return None
    heading = next((line for line in lines if re.match(r"^\d+[.:]\s*", line) and not re.fullmatch(r"\d+\.", line)), f"Information {page_number}")
    heading = re.sub(r"^\d+[.:]\s*", "", heading)
    marker = min((index for index, line in enumerate(lines) if line in ("Mark only one oval.", "Tick all that apply.", "Files submitted:", "Dropdown")), default=0)
    candidates = [line for line in lines[marker + 1:] if not re.fullmatch(r"\d+\.?", line) and line not in ("Other:", "Mark only one oval.", "Tick all that apply.", "Files submitted:", "Dropdown")]
    labels = candidates[-len(starts):]
    if not labels: return None
    fields = []
    for index, (start, raw_label) in enumerate(zip(starts, labels)):
        end = starts[index + 1] if index + 1 < len(starts) else len(lines)
        block = lines[start:end]
        field_kind = kind(block)
        label = raw_label.rstrip("*").strip()
        marker_index = next((i for i, line in enumerate(block) if line in ("Mark only one oval.", "Tick all that apply.", "Files submitted:", "Dropdown")), None)
        options = []
        allow_other = False
        if marker_index is not None and field_kind in ("radio", "checkbox", "select"):
            for option in block[marker_index + 1:]:
                if option in labels: break
                if option == "Other:":
                    allow_other = True
                elif re.search(r"[A-Za-z]", option):
                    options.append(option)
        number = lines[start].rstrip(".")
        fields.append({"id": f"{slug}-q-{number}", "label": label, "type": field_kind, "required": raw_label.endswith("*"), "options": options, "allowOther": allow_other, "validation": input_type(label), "order": index + 1})
    return {"id": f"{slug}-section-{page_number}", "title": heading, "order": page_number, "fields": fields}

documents = json.loads((ROOT / "src/data/pdf-pages.json").read_text(encoding="utf-8"))
forms = []
for slug, title, filename_part in ROUTES:
    document = next(item for item in documents if filename_part in item["filename"])
    sections = [section for index, page in enumerate(document["pages"], 1) if (section := parse_page(page, slug, index))]
    forms.append({"id": slug, "slug": slug, "title": title, "description": None, "sections": sections})

(ROOT / "src/data/form-definitions.json").write_text(json.dumps(forms, ensure_ascii=False, indent=2), encoding="utf-8")
