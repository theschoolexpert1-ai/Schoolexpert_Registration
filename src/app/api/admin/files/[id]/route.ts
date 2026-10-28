import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { downloadStorageFile } from "@/lib/storage";

type Props = { params: Promise<{ id: string }> };

function safeFilename(name: string) { return name.replace(/[\r\n"\\]/g, "_"); }

export async function GET(_request: Request, { params }: Props) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const upload = await db.fileUpload.findUnique({ where: { id }, select: { filename: true, mimeType: true, storagePath: true, bytes: true } });
  if (!upload) return NextResponse.json({ error: "File not found." }, { status: 404 });
  try {
    const data = upload.storagePath ? await downloadStorageFile(upload.storagePath) : upload.bytes ? Buffer.from(upload.bytes) : null;
    if (!data) return NextResponse.json({ error: "File content is unavailable." }, { status: 404 });
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": upload.mimeType || "application/octet-stream", "Content-Disposition": `attachment; filename="${safeFilename(upload.filename)}"`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Admin file download failed", error);
    return NextResponse.json({ error: "Unable to retrieve file." }, { status: 500 });
  }
}
