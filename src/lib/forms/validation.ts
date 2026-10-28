import type { Field, FormDefinition } from "./types";

export type AnswerValue = string | string[];

export function isBlank(value: AnswerValue | undefined) {
  if (value === undefined) return true;
  return Array.isArray(value) ? value.length === 0 : value.trim().length === 0;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidNumber(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  return normalized !== "" && Number.isFinite(Number(normalized));
}

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isAllowedChoice(field: Field, value: string) {
  if ((field.options ?? []).includes(value)) return true;
  if (!field.allowOther) return false;
  return value === "Other" || value.startsWith("Other: ") && value.slice(7).trim().length > 0;
}

export function validateField(field: Field, value: AnswerValue | undefined, file?: File | null) {
  if (field.type === "file") {
    if (field.required && !file) return "This field is required.";
    return null;
  }

  if (field.required && isBlank(value)) return "This field is required.";
  if (value === undefined || isBlank(value)) return null;

  if (["radio", "select"].includes(field.type) && Array.isArray(value)) return "Please select one option.";
  if (field.type === "checkbox" && !Array.isArray(value)) return "Please select one or more options.";
  if ((field.type === "text" || field.type === "textarea") && Array.isArray(value)) return "Invalid answer.";

  const values = Array.isArray(value) ? value : [value];
  if (["radio", "select", "checkbox"].includes(field.type)) {
    for (const item of values) {
      if (!isAllowedChoice(field, item)) return "Invalid selection.";
      if (item === "Other") return "Please specify your other answer.";
    }
  }

  if (field.type === "text" && typeof value === "string") {
    switch (field.validation) {
      case "email": if (!isValidEmail(value)) return "Enter a valid email address."; break;
      case "phone": if (!isValidPhone(value)) return "Enter a valid phone number."; break;
      case "url": if (!isValidUrl(value)) return "Enter a valid URL starting with http:// or https://."; break;
      case "number": if (!isValidNumber(value)) return "Enter a valid number."; break;
      case "date": if (!isValidDate(value)) return "Enter a valid date."; break;
    }
  }

  return null;
}

export function validateForm(form: FormDefinition, answers: Record<string, AnswerValue>, files: Record<string, File>) {
  const errors: Record<string, string> = {};
  for (const field of form.sections.flatMap((section) => section.fields)) {
    const error = validateField(field, answers[field.id], files[field.id]);
    if (error) errors[field.id] = error;
  }
  return errors;
}
