import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : Array.isArray(value) ? value.join("; ") : typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const url = new URL(request.url);
  const formSlug = url.searchParams.get("form") || "";
  const form = formSlug ? await db.form.findUnique({ where: { slug: formSlug }, select: { id: true } }) : null;
  if (formSlug && !form) return NextResponse.json({ error: "Unknown form." }, { status: 404 });
  const submissions = await db.submission.findMany({ where: form ? { formId: form.id } : undefined, orderBy: { createdAt: "desc" }, include: { form: { select: { title: true } }, answers: { include: { question: { select: { key: true, label: true } } } } } });
  const columns = Array.from(new Set(submissions.flatMap((s) => s.answers.map((a) => a.question.key))));
  const labels = new Map(submissions.flatMap((s) => s.answers.map((a) => [a.question.key, a.question.label] as const)));
  const rows = [
    ["Submission ID", "Form", "Status", "Created At", "Submitted At", ...columns.map((key) => labels.get(key) || key)].map(csvCell).join(","),
    ...submissions.map((s) => { const values = new Map(s.answers.map((a) => [a.question.key, a.value])); return [s.id, s.form.title, s.status, s.createdAt.toISOString(), s.submittedAt?.toISOString() || "", ...columns.map((key) => values.get(key) ?? "")].map(csvCell).join(","); }),
  ];
  return new NextResponse(rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="submissions${formSlug ? `-${formSlug}` : ""}.csv"`, "Cache-Control": "private, no-store" } });
}
