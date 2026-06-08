import { NextResponse } from "next/server";
import { setAdminCookie, clearAdminCookie } from "@/lib/adminAuth";
import { timingSafeEqual, createHash } from "node:crypto";

function safeCompare(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// POST /api/admin/login  body: { password }
export async function POST(req: Request) {
  const { password, remember } = (await req.json()) as { password?: string; remember?: boolean };
  const expected = process.env.ADMIN_PASSWORD ?? "";

  if (!password || !safeCompare(password, expected)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  return setAdminCookie(res, remember === true);
}

// DELETE /api/admin/login — 退出登录
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  return clearAdminCookie(res);
}
