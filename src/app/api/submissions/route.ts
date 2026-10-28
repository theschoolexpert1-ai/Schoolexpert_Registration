import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadStorageFile, deleteStorageFile } from "@/lib/storage";
import crypto from "node:crypto";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type AnswerValue = string | string[];

function isAnswer(value: unknown): value is AnswerValue {
  return typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

function safeExtension(filename: string) {
  const match = filename.match(/\.([a-zA-Z0-9]{1,10})$/);
  return match ? `.${match[1].toLowerCase()}` : ".bin";
}

function isBlank(value: AnswerValue | undefined) {
  if (value === undefined) return true;
  return Array.isArray(value) ? value.length === 0 : value.trim().length === 0;
}

function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function isValidPhone(value: string) { const digits = value.replace(/\D/g, ""); return digits.length >= 7 && digits.length <= 15; }
function isValidUrl(value: string) { try { const url = new URL(value.trim()); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
function isValidNumber(value: string) { const normalized = value.trim().replace(/,/g, ""); return normalized !== "" && Number.isFinite(Number(normalized)); }
function isValidDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }

function isAllowedChoice(question: any, value: string) {
  if (question.options.some((option: any) => option.value === value)) return true;
  if (!question.allowOther) return false;
  return value === "Other" || (value.startsWith("Other: ") && value.slice(7).trim().length > 0);
}

function validateQuestion(question: any, value: AnswerValue | undefined, file: File | null) {
  if (question.type === "file") {
    if (question.required && (!file || !file.size)) return "This field is required.";
    return null;
  }
  if (question.required && isBlank(value)) return "This field is required.";
  if (value === undefined || isBlank(value)) return null;
  if (["radio", "select"].includes(question.type) && Array.isArray(value)) return "Please select one option.";
  if (question.type === "checkbox" && !Array.isArray(value)) return "Please select one or more options.";
  if (["text", "textarea"].includes(question.type) && Array.isArray(value)) return "Invalid answer.";

  const values = Array.isArray(value) ? value : [value];
  if (["radio", "select", "checkbox"].includes(question.type)) {
    for (const item of values) {
      if (!isAllowedChoice(question, item)) return "Invalid selection.";
      if (item === "Other") return "Please specify your other answer.";
    }
  }

  if (question.type === "text" && typeof value === "string") {
    if (question.validation === "email" && !isValidEmail(value)) return "Enter a valid email address.";
    if (question.validation === "phone" && !isValidPhone(value)) return "Enter a valid phone number.";
    if (question.validation === "url" && !isValidUrl(value)) return "Enter a valid URL starting with http:// or https://.";
    if (question.validation === "number" && !isValidNumber(value)) return "Enter a valid number.";
    if (question.validation === "date" && !isValidDate(value)) return "Enter a valid date.";
  }
  return null;
}

export async function POST(request: Request) {
  const uploadedStoragePaths: string[] = [];
  try {
    const body = await request.formData();
    const formSlug = body.get("formSlug");
    const answersRaw = body.get("answers");
    if (typeof formSlug !== "string" || typeof answersRaw !== "string") return NextResponse.json({ error: "Invalid submission payload." }, { status: 400 });

    let rawAnswers: Record<string, unknown>;
    try {
      const parsed = JSON.parse(answersRaw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Answers must be an object.");
      rawAnswers = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid answers payload." }, { status: 400 });
    }

    const seededForm = await db.form.findUnique({
      where: { slug: formSlug },
      include: {
        versions: {
          orderBy: { version: "desc" },
          include: { questions: { include: { options: true } } },
        },
      },
    });
    if (!seededForm) return NextResponse.json({ error: "This form is not available." }, { status: 404 });

    const version = seededForm.versions.find((item) => item.version === seededForm.currentVersion);
    if (!version) return NextResponse.json({ error: "This form version is not available." }, { status: 409 });

    const questionByKey = new Map(version.questions.map((question) => [question.key, question]));
    const questionById = new Map(version.questions.map((question) => [question.id, question]));
    const normalizedAnswers: Record<string, AnswerValue> = {};
    const errors: Record<string, string> = {};

    for (const [incomingKey, value] of Object.entries(rawAnswers)) {
      if (!questionByKey.has(incomingKey) && !questionById.has(incomingKey)) {
        errors[incomingKey] = "Unknown field.";
        continue;
      }
      if (!isAnswer(value)) {
        errors[incomingKey] = "Invalid answer.";
        continue;
      }
      const question = questionByKey.get(incomingKey) ?? questionById.get(incomingKey)!;
      normalizedAnswers[question.id] = value;
    }
    if (Object.keys(errors).length) return NextResponse.json({ error: "Invalid submission fields.", fields: errors }, { status: 400 });

    for (const question of version.questions) {
      const value = normalizedAnswers[question.id];
      const file = question.type === "file"
        ? ((body.get(`file:${question.key}`) instanceof File ? body.get(`file:${question.key}`) : body.get(`file:${question.id}`)) as File | null)
        : null;
      const error = validateQuestion(question, value, file);
      if (error) errors[question.key] = error;
      if (file instanceof File && file.size > MAX_UPLOAD_BYTES) errors[question.key] = "An uploaded file is too large.";
    }

    if (Object.keys(errors).length) {
      return NextResponse.json({ error: "Please correct the highlighted fields.", fields: errors }, { status: 422 });
    }

    const submission = await db.submission.create({
      data: {
        formId: seededForm.id,
        formVersionId: version.id,
        status: "SUBMITTED",
        submittedAt: new Date(),
        answers: {
          create: version.questions.map((question) => ({
            questionId: question.id,
            value: normalizedAnswers[question.id] ?? "",
          })),
        },
      },
    });

    try {
      for (const question of version.questions) {
        if (question.type !== "file") continue;
        const keyFile = body.get(`file:${question.key}`);
        const idFile = body.get(`file:${question.id}`);
        const file = keyFile instanceof File ? keyFile : idFile instanceof File ? idFile : null;
        if (!file || !file.size) continue;
        const answer = await db.answer.findUnique({ where: { submissionId_questionId: { submissionId: submission.id, questionId: question.id } }, select: { id: true } });
        if (!answer) throw new Error(`Answer was not created for file question ${question.key}.`);
        const uploadId = crypto.randomUUID();
        const storagePath = `submissions/${submission.id}/${uploadId}${safeExtension(file.name)}`;
        const bytes = new Uint8Array(await file.arrayBuffer());
        await uploadStorageFile(storagePath, bytes, file.type || "application/octet-stream");
        uploadedStoragePaths.push(storagePath);
        await db.fileUpload.create({ data: { id: uploadId, answerId: answer.id, filename: file.name, mimeType: file.type || "application/octet-stream", storagePath, size: file.size } });
      }
    } catch (error) {
      for (const storagePath of uploadedStoragePaths) await deleteStorageFile(storagePath).catch(() => undefined);
      await db.submission.delete({ where: { id: submission.id } }).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({ id: submission.id });
  } catch (error) {
    console.error("Submission processing failed", error);
    return NextResponse.json({ error: "We could not process your submission. Please try again." }, { status: 500 });
  }
}
