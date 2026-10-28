import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import PrintSubmissionButton from "@/components/admin/print-submission-button";

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

export default async function SubmissionPdfPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const submission = await db.submission.findUnique({
    where: { id },
    include: {
      form: { select: { title: true, slug: true } },
      formVersion: { include: { sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" } } } } } },
      answers: { select: { questionId: true, value: true } },
    },
  });
  if (!submission) notFound();
  const answerMap = new Map(submission.answers.map((answer) => [answer.questionId, answer.value]));

  return (
    <main className="submission-print-shell">
      <div className="submission-print-actions no-print">
        <Link className="admin-back" href={`/admin/submissions/${submission.id}`}>← Back to submission</Link>
        <PrintSubmissionButton />
      </div>
      <article className="submission-print-document">
        <header className="submission-print-header">
          <div className="submission-print-logo">SE</div>
          <p className="submission-print-eyebrow">THE SCHOOL EXPERT™ · REGISTRATION RECORD</p>
          <h1>{submission.form.title}</h1>
          <p className="submission-print-meta">Submission ID: {submission.id}</p>
          <p className="submission-print-meta">Submitted: {formatIndiaDateTime(submission.submittedAt || submission.createdAt)}</p>
          <p className="submission-print-meta">Status: {submission.status.replaceAll("_", " ")}</p>
        </header>
        {submission.formVersion.sections.map((section) => {
          const printableQuestions = section.questions.filter((question) => question.type !== "file");
          if (!printableQuestions.length) return null;
          return (
            <section className="submission-print-section" key={section.id}>
              <h2>{section.title}</h2>
              <div className="submission-print-answers">
                {printableQuestions.map((question) => (
                  <div className="submission-print-answer" key={question.id}>
                    <p className="submission-print-question">{question.label}{question.required ? " *" : ""}</p>
                    <p className="submission-print-value">{displayValue(answerMap.get(question.id))}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        <footer className="submission-print-footer">The School Expert™ · Confidential registration record</footer>
      </article>
      <p className="submission-print-help no-print">Choose <strong>Save as PDF</strong> in your browser’s print dialog to download this record. Uploaded documents are not included.</p>
    </main>
  );
}
