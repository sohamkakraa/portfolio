import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminSession } from "@/lib/auth";

const BLOB_CONFIGURED = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
const ON_VERCEL = process.env.VERCEL === "1";

/** Vercel Functions cap request bodies at 4.5MB (server upload → Blob). Local / disk can be larger. */
const MAX_BYTES = (() => {
  if (BLOB_CONFIGURED && ON_VERCEL) return Math.floor(4.5 * 1024 * 1024);
  if (BLOB_CONFIGURED) return 12 * 1024 * 1024;
  return 45 * 1024 * 1024;
})();

function uploadDisabledOnVercelResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        "This deployment cannot save files to disk. In Vercel: Project → Storage → create a Blob store linked to this app (adds BLOB_READ_WRITE_TOKEN), then Redeploy. See .env.example. Alternative: upload locally and git-push files under public/.",
    },
    { status: 503 }
  );
}

function explainFsError(err: unknown): string {
  if (!err || typeof err !== "object") return "Could not save file on the server.";
  const e = err as NodeJS.ErrnoException & { message?: string };
  if (e.code === "EROFS" || e.code === "EPERM") {
    return "Server filesystem is read-only. Configure Vercel Blob (BLOB_READ_WRITE_TOKEN) or upload from your computer.";
  }
  if (e.code === "ENOSPC") return "Server disk is full.";
  if (process.env.NODE_ENV === "development" && e.message) return e.message;
  return "Could not save file on the server.";
}

export async function POST(request: Request) {
  const session = await verifyAdminSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const csrf = request.headers.get("x-csrf-token");
  if (!csrf || csrf !== session.csrfToken) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;
    const scope = (formData.get("scope") as string | null) || "photography";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: `File is too large (max ${Math.floor(MAX_BYTES / (1024 * 1024))}MB).`,
        },
        { status: 413 }
      );
    }

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const timestamp = Date.now();
    let uploadDir: string;
    let publicPath: string;
    let safeName: string;
    let blobPathname: string;

    if (scope === "about") {
      safeName = `portrait-${timestamp}${ext}`;
      blobPathname = `about/${safeName}`;
      uploadDir = path.join(process.cwd(), "public", "about");
      publicPath = `/about/${safeName}`;

      if (BLOB_CONFIGURED) {
        const blob = await put(blobPathname, file, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: file.type || undefined,
        });
        return NextResponse.json({ success: true, path: blob.url, filename: safeName, storage: "blob" });
      }
      if (ON_VERCEL) return uploadDisabledOnVercelResponse();
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));
      return NextResponse.json({ success: true, path: publicPath, filename: safeName, storage: "disk" });
    }

    if (scope === "books") {
      const baseName =
        path
          .basename(file.name, ext)
          .replace(/[^a-z0-9-_]/gi, "-")
          .toLowerCase() || "cover";
      safeName = `${baseName}-${timestamp}${ext}`;
      blobPathname = `books/${safeName}`;
      uploadDir = path.join(process.cwd(), "public", "books");
      publicPath = `/books/${safeName}`;

      if (BLOB_CONFIGURED) {
        const blob = await put(blobPathname, file, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: file.type || undefined,
        });
        return NextResponse.json({ success: true, path: blob.url, filename: safeName, storage: "blob" });
      }
      if (ON_VERCEL) return uploadDisabledOnVercelResponse();
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));
      return NextResponse.json({ success: true, path: publicPath, filename: safeName, storage: "disk" });
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "No category specified for photography upload." },
        { status: 400 }
      );
    }

    const safeCategory = category.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
    if (!safeCategory) {
      return NextResponse.json(
        { success: false, message: "Invalid category slug for photography upload." },
        { status: 400 }
      );
    }

    const baseName = path
      .basename(file.name, ext)
      .replace(/[^a-z0-9-_]/gi, "-")
      .toLowerCase();
    safeName = `${baseName}-${timestamp}${ext}`;
    blobPathname = `photography/${safeCategory}/${safeName}`;
    uploadDir = path.join(process.cwd(), "public", "photography", safeCategory);
    publicPath = `/photography/${safeCategory}/${safeName}`;

    if (BLOB_CONFIGURED) {
      const blob = await put(blobPathname, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: file.type || undefined,
      });
      return NextResponse.json({ success: true, path: blob.url, filename: safeName, storage: "blob" });
    }
    if (ON_VERCEL) return uploadDisabledOnVercelResponse();

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: publicPath,
      filename: safeName,
      storage: "disk",
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message =
      error instanceof Error
        ? error.message || explainFsError(error)
        : explainFsError(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
