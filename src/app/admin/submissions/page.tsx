import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function formatIndiaDateTime(date: Date) {
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

type Props = { searchParams: Promise<{ form?: string; status?: string; q?: string; page?: string }> };

export default async function AdminSubmissionsPage({ searchParams }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const params = await searchParams;
  const formSlug = params.form || "";
  const status = params.status || "";
  const q = params.q?.trim() || "";
  const page = Math.max(1, Number(params.page || "1") || 1);
  const forms = await db.form.findMany({ orderBy: { title: "asc" }, select: { id: true, slug: true, title: true } });
  const form = formSlug ? forms.find((item) => item.slug === formSlug) : undefined;
  const where: any = {};
  if (form) where.formId = form.id;
  if (["DRAFT", "SUBMITTED", "MIGRATED", "MIGRATION_FAILED"].includes(status)) where.status = status;
  if (q) where.id = { contains: q };
  const [total, submissions] = await Promise.all([
    db.submission.count({ where }),
    db.submission.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { form: { select: { title: true, slug: true } }, formVersion: { select: { version: true } }, _count: { select: { answers: true } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (nextPage: number) => { const search = new URLSearchParams(); if (formSlug) search.set("form", formSlug); if (status) search.set("status", status); if (q) search.set("q", q); search.set("page", String(nextPage)); return `/admin/submissions?${search}`; };
  return <main className="admin-shell"><header className="admin-topbar"><div><Link className="admin-back" href="/admin">← Dashboard</Link><p className="admin-eyebrow">Submissions</p><h1>{form?.title || "All submissions"}</h1></div><Link className="admin-button" href={`/api/admin/submissions/export?form=${encodeURIComponent(formSlug)}`}>Export CSV</Link></header><section className="admin-panel"><form className="admin-filters" method="get"><select name="form" defaultValue={formSlug}><option value="">All forms</option>{forms.map((item) => <option key={item.id} value={item.slug}>{item.title}</option>)}</select><select name="status" defaultValue={status}><option value="">All statuses</option><option value="SUBMITTED">Submitted</option><option value="MIGRATED">Migrated</option><option value="MIGRATION_FAILED">Migration failed</option><option value="DRAFT">Draft</option></select><input name="q" defaultValue={q} placeholder="Search submission ID" /><button type="submit">Search</button></form><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Form</th><th>Submission</th><th>Answers</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>{submissions.length ? submissions.map((item) => <tr key={item.id}><td>{item.form.title}<small>v{item.formVersion.version}</small></td><td><code>{item.id}</code></td><td>{item._count.answers}</td><td><span className={`status status-${item.status.toLowerCase()}`}>{item.status}</span></td><td>{formatIndiaDateTime(item.submittedAt || item.createdAt)}</td><td><div className="submission-row-actions"><Link className="admin-link" href={`/admin/submissions/${item.id}`}>View</Link><Link className="admin-link" href={`/admin/submissions/${item.id}/pdf`} target="_blank" rel="noreferrer">Export PDF</Link></div></td></tr>) : <tr><td colSpan={6} className="admin-empty">No submissions found.</td></tr>}</tbody></table></div><div className="admin-pagination"><span>Page {page} of {pages} · {total} submissions</span><div>{page > 1 && <Link href={href(page - 1)}>← Previous</Link>}{page < pages && <Link href={href(page + 1)}>Next →</Link>}</div></div></section></main>;
}
