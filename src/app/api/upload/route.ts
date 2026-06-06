import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_MB   = 100;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// POST /api/upload — 上传图片或视频（仅管理员）
// 请求：multipart/form-data  字段名 "file"
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "未找到文件字段 'file'" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `文件不能超过 ${MAX_MB} MB` }, { status: 413 });
  }

  // 确定扩展名
  const ext = path.extname(file.name).toLowerCase() || ".bin";
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".webm"];
  if (!allowedExts.includes(ext)) {
    return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
  }

  // 生成唯一文件名
  const filename = `${randomUUID()}${ext}`;

  // 上传目录：优先使用环境变量，否则写到 public/uploads（开发用）
  const uploadDir =
    process.env.UPLOAD_DIR ??
    path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  // 返回可访问的 URL（假设 uploads 目录由 nginx / Next.js 的 public 托管）
  const url = `/uploads/${filename}`;

  return NextResponse.json({ url, filename }, { status: 201 });
}
