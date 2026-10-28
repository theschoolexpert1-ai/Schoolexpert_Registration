import definitions from "../src/data/form-definitions.json" with { type: "json" };

const targets = new Set(["school-registration", "alternative-school", "inclusive-school", "preschool", "special-school"]);
const expectedAdmission = [
  "Admissions Open",
  "Application Start Date",
  "Application Closing Date",
  "Application grades which are open for application",
  "Application open for which Academic Year (Format:2026-2027)",
  "Admission Process",
  "Entrance Assessment",
  "F2F Interview",
  "Documents Required for application",
  "Admissions Link",
  "Application Fee",
  "Approximate Fee Range (Minimum - Maximum)",
];
const expectedMedia = [
  "School Logo",
  "Front Campus Photograph",
  "Campus/Infrastructure Photos",
  "Classroom Photos",
  "Laboratory Photos",
  "Sports Photos",
  "Activities Photos",
  "Leadership Photograph",
  "School Video/YouTube Link",
];

const errors = [];
for (const form of definitions.filter((item) => targets.has(item.slug))) {
  const admission = form.sections.find((section) => section.title === "Admission Details");
  const media = form.sections.find((section) => section.title === "Photos & Media");
  if (!admission) errors.push(`${form.slug}: missing Admission Details section`);
  if (!media) errors.push(`${form.slug}: missing Photos & Media section`);
  if (!admission || !media) continue;
  if (admission.fields.map((field) => field.label).join("|") !== expectedAdmission.join("|")) errors.push(`${form.slug}: Admission Details fields do not match the required list`);
  if (media.fields.map((field) => field.label).join("|") !== expectedMedia.join("|")) errors.push(`${form.slug}: Photos & Media fields do not match the required list`);
  for (const field of [...admission.fields, ...media.fields]) if (field.required !== true) errors.push(`${form.slug}: ${field.label} must be required`);
  if (admission.fields.find((field) => field.label === "Application Start Date")?.validation !== "date") errors.push(`${form.slug}: Application Start Date must be date validation`);
  if (admission.fields.find((field) => field.label === "Application Closing Date")?.validation !== "date") errors.push(`${form.slug}: Application Closing Date must be date validation`);
  if (admission.fields.find((field) => field.label === "Admissions Link")?.validation !== "url") errors.push(`${form.slug}: Admissions Link must be URL validation`);
  if (media.fields.find((field) => field.label === "School Video/YouTube Link")?.validation !== "url") errors.push(`${form.slug}: School Video/YouTube Link must be URL validation`);
  const grades = admission.fields.find((field) => field.label.startsWith("Application grades"));
  const expectedGrades = ["LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
  if (grades?.type !== "checkbox" || JSON.stringify(grades.options) !== JSON.stringify(expectedGrades)) errors.push(`${form.slug}: grade options must be LKG through 12th`);
  for (const label of ["Admissions Open", "Entrance Assessment", "F2F Interview"]) {
    const field = admission.fields.find((item) => item.label === label);
    if (field?.type !== "radio" || JSON.stringify(field.options) !== JSON.stringify(["Yes", "No"])) errors.push(`${form.slug}: ${label} must be Yes/No`);
  }
  if (media.order <= admission.order) errors.push(`${form.slug}: Photos & Media must follow Admission Details`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Admission/media catalog validation passed for 5 forms.");
