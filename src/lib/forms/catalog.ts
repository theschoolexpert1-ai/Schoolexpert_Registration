import definitions from "@/data/form-definitions.json";
import type { FormDefinition } from "./types";

// The checked-in catalog is the sole production definition. PDF import scripts
// are only used to regenerate and audit this source-controlled data.
export const forms = definitions as unknown as FormDefinition[];

export const getForm = (slug: string) => forms.find((form) => form.slug === slug);
