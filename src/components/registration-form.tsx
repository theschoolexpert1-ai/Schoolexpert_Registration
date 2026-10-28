"use client";

import Link from "next/link";
import { useState } from "react";
import type { Field, FormDefinition } from "@/lib/forms/types";
import { validateField } from "@/lib/forms/validation";

type Answer = string | string[];

function FieldInput({ field, value, file, onChange, onFileChange }: { field: Field; value: Answer; file?: File; onChange: (value: Answer) => void; onFileChange: (file?: File) => void }) {
  const common = { "aria-required": field.required, "aria-invalid": undefined };
  if (field.type === "file") return <><input id={field.id} type="file" {...common} onChange={(event) => onFileChange(event.target.files?.[0])} />{file && <small>{file.name}</small>}</>;
  if (field.type === "textarea") return <textarea id={field.id} {...common} value={String(value)} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === "select") return <select id={field.id} {...common} value={String(value)} onChange={(event) => onChange(event.target.value)}><option value="">Select an option</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (field.type === "radio") return <div className="options" role="radiogroup" aria-required={field.required}>{field.options?.map((option) => <label key={option}><input type="radio" name={field.id} checked={value === option} onChange={() => onChange(option)} />{option}</label>)}</div>;
  if (field.type === "checkbox") return <div className="options" role="group" aria-required={field.required}>{field.options?.map((option) => <label key={option}><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={(event) => onChange(event.target.checked ? [...(Array.isArray(value) ? value : []), option] : (Array.isArray(value) ? value.filter((item) => item !== option) : []))} />{option}</label>)}</div>;
  const type = field.validation === "email" ? "email" : field.validation === "url" ? "url" : field.validation === "number" ? "number" : field.validation === "date" ? "date" : "text";
  return <input id={field.id} type={type} {...common} value={String(value)} onChange={(event) => onChange(event.target.value)} />;
}

export function RegistrationForm({ form }: { form: FormDefinition }) {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [navigationError, setNavigationError] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const section = form.sections[page];
  const progress = Math.round(((page + 1) / form.sections.length) * 100);

  function validate(fields: Field[]) {
    const next: Record<string, string> = {};
    fields.forEach((field) => {
      const error = validateField(field, answers[field.id], files[field.id]);
      if (error) next[field.id] = error;
    });
    setErrors((current) => {
      const merged = { ...current };
      for (const field of fields) delete merged[field.id];
      return { ...merged, ...next };
    });
    return next;
  }

  function focusFirstError(fieldErrors: Record<string, string>) {
    const firstFieldId = Object.keys(fieldErrors)[0];
    if (!firstFieldId) return;
    window.setTimeout(() => {
      const wrapper = document.getElementById(`field-${firstFieldId}`);
      if (!wrapper) return;
      wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
      wrapper.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
    }, 50);
  }

  function goToNextSection() {
    const sectionErrors = validate(section.fields);
    if (Object.keys(sectionErrors).length) {
      setNavigationError(true);
      focusFirstError(sectionErrors);
      return;
    }
    setNavigationError(false);
    setPage((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const allErrors = validate(form.sections.flatMap((item) => item.fields));
    if (Object.keys(allErrors).length) {
      const firstErrorSection = form.sections.findIndex((item) => item.fields.some((field) => Boolean(allErrors[field.id])));
      setNavigationError(true);
      if (firstErrorSection >= 0 && firstErrorSection !== page) {
        setPage(firstErrorSection);
        window.setTimeout(() => focusFirstError(allErrors), 50);
      } else focusFirstError(allErrors);
      return;
    }

    setNavigationError(false);
    setStatus("submitting");
    const data = new FormData();
    data.append("formSlug", form.slug);
    const keyedAnswers: Record<string, Answer> = {};
    for (const field of form.sections.flatMap((item) => item.fields)) {
      if (answers[field.id] !== undefined) keyedAnswers[field.key] = answers[field.id];
      if (files[field.id]) data.append(`file:${field.key}`, files[field.id]);
    }
    data.append("answers", JSON.stringify(keyedAnswers));

    try {
      const response = await fetch("/api/submissions", { method: "POST", body: data });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const fieldErrors: Record<string, string> = {};
        if (payload?.fields && typeof payload.fields === "object") {
          for (const field of form.sections.flatMap((item) => item.fields)) {
            const message = payload.fields[field.key] ?? payload.fields[field.id];
            if (typeof message === "string") fieldErrors[field.id] = message;
          }
        }
        setErrors(fieldErrors);
        setNavigationError(true);
        setStatus("error");
        const firstErrorSection = form.sections.findIndex((item) => item.fields.some((field) => Boolean(fieldErrors[field.id])));
        if (firstErrorSection >= 0 && firstErrorSection !== page) {
          setPage(firstErrorSection);
          window.setTimeout(() => focusFirstError(fieldErrors), 50);
        } else focusFirstError(fieldErrors);
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") return <main className="form-shell"><section className="success"><p className="eyebrow">Submission received</p><h1>Your response has been submitted successfully.</h1><p>Thank you for registering with The School Expert.</p><Link className="success-home" href="/">Back to home</Link></section></main>;

  return <main className="form-shell"><a className="back-link" href="/">&larr; All registration forms</a><header className="form-heading"><p className="eyebrow">The School Expert</p><h1>{form.title}</h1><p>Fields marked <em>*</em> are required.</p></header><div className="progress"><span style={{ width: `${progress}%` }} /></div><p className="progress-label">Section {page + 1} of {form.sections.length}</p><form noValidate onSubmit={submit}><section className="section-card"><h2>{section.title}</h2>{section.description && <div className="section-description">{section.description.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}{section.fields.map((field) => <div id={`field-${field.id}`} className={`field${errors[field.id] ? " has-error" : ""}`} key={field.id}><label htmlFor={field.id}>{field.label}{field.required && <em> *</em>}</label><FieldInput field={field} value={answers[field.id] ?? (field.type === "checkbox" ? [] : "")} file={files[field.id]} onChange={(value) => { setAnswers((current) => ({ ...current, [field.id]: value })); setErrors((current) => ({ ...current, [field.id]: "" })); setNavigationError(false); setStatus("idle"); }} onFileChange={(file) => { setFiles((current) => { const next = { ...current }; if (file) next[field.id] = file; else delete next[field.id]; return next; }); setErrors((current) => ({ ...current, [field.id]: "" })); setNavigationError(false); setStatus("idle"); }} />{errors[field.id] && <p className="field-error" role="alert">{errors[field.id]}</p>}</div>)}</section><div className="nav">{page > 0 && <button type="button" className="secondary" onClick={() => { setNavigationError(false); setStatus("idle"); setPage((current) => current - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Back</button>}{page < form.sections.length - 1 ? <button type="button" onClick={goToNextSection}>Next section</button> : <button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Submitting..." : "Submit registration"}</button>}</div>{navigationError && <p className="navigation-error" role="alert">Please complete all required fields before continuing. The first incomplete field has been highlighted above.</p>}{status === "error" && <p className="error" role="alert">We could not submit your form. Please check the highlighted fields and try again.</p>}</form></main>;
}
