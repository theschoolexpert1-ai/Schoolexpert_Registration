const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "school-submissions";

function requireConfig() {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required for file storage.");
  if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for file storage.");
  return { baseUrl: SUPABASE_URL, serviceRoleKey: SERVICE_ROLE_KEY, bucket: BUCKET };
}

function encodePath(path: string) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export async function uploadStorageFile(path: string, data: ArrayBuffer | Uint8Array, contentType: string) {
  const { baseUrl, serviceRoleKey, bucket } = requireConfig();
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: Buffer.from(data instanceof Uint8Array ? data : new Uint8Array(data)),
  });
  if (!response.ok) throw new Error(`Supabase Storage upload failed (${response.status}): ${await response.text()}`);
}

export async function downloadStorageFile(path: string) {
  const { baseUrl, serviceRoleKey, bucket } = requireConfig();
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
    headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
  });
  if (!response.ok) throw new Error(`Supabase Storage download failed (${response.status}): ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteStorageFile(path: string) {
  const { baseUrl, serviceRoleKey, bucket } = requireConfig();
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  });
  if (!response.ok) throw new Error(`Supabase Storage delete failed (${response.status}): ${await response.text()}`);
}

export function storageBucketName() { return BUCKET; }
