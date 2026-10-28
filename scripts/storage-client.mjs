function config() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "school-submissions";
  if (!baseUrl) throw new Error("SUPABASE_URL is required.");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  return { baseUrl, serviceRoleKey, bucket };
}
function encodePath(path) { return path.split("/").map((part) => encodeURIComponent(part)).join("/"); }
function headers(extra={}) { const {serviceRoleKey}=config(); return { Authorization:`Bearer ${serviceRoleKey}`, apikey:serviceRoleKey, ...extra }; }
export async function storageUpload(path, bytes, contentType) { const {baseUrl,bucket}=config(); const r=await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`,{method:"POST",headers:headers({"Content-Type":contentType||"application/octet-stream","x-upsert":"true"}),body:bytes}); if(!r.ok) throw new Error(`Storage upload failed (${r.status}): ${await r.text()}`); }
export async function storageDownload(path) { const {baseUrl,bucket}=config(); const r=await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`,{headers:headers()}); if(!r.ok) throw new Error(`Storage download failed (${r.status}): ${await r.text()}`); return Buffer.from(await r.arrayBuffer()); }
export async function storageDelete(path) { const {baseUrl,bucket}=config(); const r=await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`,{method:"DELETE",headers:headers()}); if(!r.ok) throw new Error(`Storage delete failed (${r.status}): ${await r.text()}`); }
export async function storageExists(path) { const {baseUrl,bucket}=config(); const r=await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`,{method:"HEAD",headers:headers()}); return r.ok; }
export function bucketName(){ return config().bucket; }
