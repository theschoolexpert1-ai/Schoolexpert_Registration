import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import Link from "next/link";

function formatIndiaDateTime(date: Date) {
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

export const dynamic = "force-dynamic";

function shortId(id: string) { return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id; }

export default async function AdminHomePage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const [forms, total, submitted, migrated, recent] = await Promise.all([
    db.form.findMany({ orderBy: { title: "asc" }, select: { id: true, slug: true, title: true, currentVersion: true, _count: { select: { submissions: true } } } }),
    db.submission.count(),
    db.submission.count({ where: { status: "SUBMITTED" } }),
    db.submission.count({ where: { status: "MIGRATED" } }),
    db.submission.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { form: { select: { title: true } } } }),
  ]);

  return <main className="admin-app">
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand"><span className="admin-brand-mark">SE</span><span><strong>The School Expert</strong><small>Admin workspace</small></span></Link>
      <nav><p className="admin-nav-label">Workspace</p><Link className="admin-nav active" href="/admin">Overview</Link><Link className="admin-nav" href="/admin/submissions">Submissions</Link></nav>
      <div className="admin-sidebar-bottom"><span className="admin-secure-dot"/> Secure admin area</div>
    </aside>
    <div className="admin-main">
      <header className="admin-header"><div><p className="admin-eyebrow">Welcome admin</p><h1>Good to see you.</h1><p className="admin-meta">A simple view of everything coming through your registration forms.</p></div><div className="admin-header-actions"><Link className="admin-button" href="/admin/submissions">View submissions</Link><form action="/api/admin/auth/logout" method="post"><button className="admin-ghost" type="submit">Sign out</button></form></div></header>
      <section className="admin-kpis">
        <div className="admin-kpi"><span>Total submissions</span><strong>{total}</strong><small>Across all forms</small></div>
        <div className="admin-kpi"><span>Awaiting migration</span><strong>{submitted}</strong><small>Submitted records</small></div>
        <div className="admin-kpi"><span>Migrated</span><strong>{migrated}</strong><small>Successfully moved</small></div>
        <div className="admin-kpi"><span>Active forms</span><strong>{forms.length}</strong><small>Registration forms</small></div>
      </section>
      <section className="admin-panel admin-panel-clean"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Forms</p><h2>Registration forms</h2></div><Link className="admin-text-link" href="/admin/submissions">See all submissions →</Link></div>
        <div className="admin-form-grid">{forms.map((form) => <Link className="admin-form-card" key={form.id} href={`/admin/submissions?form=${encodeURIComponent(form.slug)}`}><div className="admin-form-card-top"><span className="admin-form-icon">↗</span><strong>{form._count.submissions}</strong></div><span className="admin-form-title">{form.title}</span><small>Version {form.currentVersion} · {form._count.submissions === 1 ? "1 submission" : `${form._count.submissions} submissions`}</small></Link>)}</div>
      </section>
      <section className="admin-panel admin-panel-clean"><div className="admin-panel-heading"><div><p className="admin-eyebrow">Activity</p><h2>Recent submissions</h2></div><Link className="admin-text-link" href="/admin/submissions">Open inbox →</Link></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Registration</th><th>Submission</th><th>Status</th><th>Received</th><th></th></tr></thead><tbody>{recent.length ? recent.map((item) => <tr key={item.id}><td><strong>{item.form.title}</strong></td><td><code>{shortId(item.id)}</code></td><td><span className={`status status-${item.status.toLowerCase()}`}>{item.status.replaceAll("_", " ")}</span></td><td>{formatIndiaDateTime(item.submittedAt ?? item.createdAt)}</td><td><div className="submission-row-actions"><Link className="admin-view-link" href={`/admin/submissions/${item.id}`}>View</Link><Link className="admin-view-link" href={`/admin/submissions/${item.id}/pdf`} target="_blank" rel="noreferrer">Export PDF</Link></div></td></tr>) : <tr><td colSpan={5} className="admin-empty">No submissions yet.</td></tr>}</tbody></table></div>
      </section>
    </div>
  </main>;
}
