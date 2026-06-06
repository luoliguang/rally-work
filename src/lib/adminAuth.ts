import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "rally_admin";
const TOKEN  = "authenticated"; // value stored in the cookie

/** Returns true when the request carries a valid admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === TOKEN;
}

/** Returns a 401 JSON response — use to guard admin routes. */
export function unauthorized() {
  return NextResponse.json({ error: "未授权" }, { status: 401 });
}

/** Sets the admin session cookie (called after successful login). */
export function setAdminCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE, TOKEN, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 h
    path: "/",
  });
  return response;
}

/** Clears the admin session cookie. */
export function clearAdminCookie(response: NextResponse): NextResponse {
  response.cookies.delete(COOKIE);
  return response;
}
