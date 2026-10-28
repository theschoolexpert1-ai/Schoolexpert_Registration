import { notFound } from "next/navigation";
import { getForm } from "@/lib/forms/catalog";
import { RegistrationForm } from "@/components/registration-form";

export function generateStaticParams() {
  return require("@/lib/forms/catalog").forms.map((form: { slug: string }) => ({ slug: form.slug }));
}

export default async function FormPage({ params }: { params: Promise<{ slug: string }> }) {
  const form = getForm((await params).slug);
  if (!form) notFound();
  return <RegistrationForm form={form} />;
}
