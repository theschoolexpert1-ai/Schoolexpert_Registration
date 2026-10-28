export type FieldType = "text" | "textarea" | "select" | "radio" | "checkbox" | "file";

export type Field = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  allowOther?: boolean;
  validation?: "email" | "phone" | "url" | "number" | "date";
  order?: number;
};

export type FormSection = { id: string; title: string; description?: string | null; fields: Field[]; order?: number };

export type FormDefinition = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  sections: FormSection[];
};
