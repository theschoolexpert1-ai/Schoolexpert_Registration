import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const url = new URL(request.url);
  const formSlug = url.searchParams.get("form") || "";
  const status = url.searchParams.get("status") || "";
  const q = url.searchParams.get("q")?.trim() || "";
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "25") || 25));
  const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
  const form = formSlug ? await db.form.findUnique({ where: { slug: formSlug }, select: { id: true } }) : null;
  if (formSlug && !form) return NextResponse.json({ error: "Unknown form." }, { status: 404 });
  const where: any = {};
  if (form) where.formId = form.id;
  if (["DRAFT", "SUBMITTED", "MIGRATED", "MIGRATION_FAILED"].includes(status)) where.status = status;
  if (q) where.id = { contains: q };
  const [total, data] = await Promise.all([db.submission.count({ where }), db.submission.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, select: { id: true, status: true, createdAt: true, submittedAt: true, form: { select: { slug: true, title: true } }, formVersion: { select: { version: true } }, _count: { select: { answers: true } } } })]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
