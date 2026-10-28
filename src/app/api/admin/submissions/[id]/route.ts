import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const submission = await db.submission.findUnique({ where: { id }, include: { form: { select: { id: true, slug: true, title: true } }, formVersion: { select: { id: true, version: true } }, answers: { orderBy: { question: { position: "asc" } }, include: { question: { select: { id: true, key: true, label: true, type: true, required: true, section: { select: { id: true, title: true, position: true } } } }, uploads: { select: { id: true, filename: true, mimeType: true, size: true, storagePath: true } } } } } });
  if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  return NextResponse.json(submission);
}
