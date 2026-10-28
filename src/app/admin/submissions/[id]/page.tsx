import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function formatIndiaDateTime(date: Date) {
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function SubmissionDetailPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const submission = await db.submission.findUnique({ where: { id }, include: { form: true, formVersion: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" } } } } } }, answers: { include: { question: { include: { section: true } }, uploads: true } } } });
  if (!submission) notFound();
  const answerMap = new Map(submission.answers.map((answer) => [answer.questionId, answer]));
  return <main className="admin-shell"><header className="admin-topbar"><div><Link className="admin-back" href={`/admin/submissions?form=${encodeURIComponent(submission.form.slug)}`}>← Back to submissions</Link><p className="admin-eyebrow">Submission detail</p><h1>{submission.form.title}</h1><p className="admin-meta"><code>{submission.id}</code> · {formatIndiaDateTime(submission.submittedAt ?? submission.createdAt)}</p></div><div className="submission-detail-actions"><Link className="admin-button" href={`/admin/submissions/${submission.id}/pdf`} target="_blank" rel="noreferrer">Export PDF</Link><span className={`status status-${submission.status.toLowerCase()}`}>{submission.status}</span></div></header>{submission.formVersion.sections.map((section) => <section className="admin-panel" key={section.id}><p className="admin-eyebrow">Section</p><h2>{section.title}</h2><div className="answer-grid">{section.questions.map((question) => { const answer = answerMap.get(question.id); return <div className="answer-card" key={question.id}><span>{question.label}{question.required && " *"}</span><strong>{displayValue(answer?.value)}</strong>{answer?.uploads.map((upload) => <a className="admin-file" key={upload.id} href={`/api/admin/files/${upload.id}`}>📎 {upload.filename}{upload.size ? ` (${Math.round(upload.size / 1024)} KB)` : ""}</a>)}</div>; })}</div></section>)}</main>;
}
