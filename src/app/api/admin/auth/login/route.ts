import { NextResponse } from "next/server";
import { adminCookieOptions, createAdminToken, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";
    if (!verifyAdminPassword(password)) return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set({ ...adminCookieOptions(), value: createAdminToken() });
    return response;
  } catch (error) {
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 500 });
  }
}
