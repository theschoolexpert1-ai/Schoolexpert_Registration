import { NextResponse } from "next/server";
import { adminCookieOptions } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set({ ...adminCookieOptions(), value: "", maxAge: 0 });
  return response;
}
