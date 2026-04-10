import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
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

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const timestamp = Date.now();
    let uploadDir: string;
    let publicPath: string;
    let safeName: string;

    if (scope === "about") {
      uploadDir = path.join(process.cwd(), "public", "about");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      safeName = `portrait-${timestamp}${ext}`;
      const filePath = path.join(uploadDir, safeName);
      const bytes = await file.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(bytes));
      publicPath = `/about/${safeName}`;
      return NextResponse.json({ success: true, path: publicPath, filename: safeName });
    }

    if (scope === "books") {
      uploadDir = path.join(process.cwd(), "public", "books");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const baseName = path
        .basename(file.name, ext)
        .replace(/[^a-z0-9-_]/gi, "-")
        .toLowerCase() || "cover";
      safeName = `${baseName}-${timestamp}${ext}`;
      const filePath = path.join(uploadDir, safeName);
      const bytes = await file.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(bytes));
      publicPath = `/books/${safeName}`;
      return NextResponse.json({ success: true, path: publicPath, filename: safeName });
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "No category specified for photography upload." },
        { status: 400 }
      );
    }

    // Photography (default)
    const safeCategory = category.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
    uploadDir = path.join(process.cwd(), "public", "photography", safeCategory);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const baseName = path
      .basename(file.name, ext)
      .replace(/[^a-z0-9-_]/gi, "-")
      .toLowerCase();
    safeName = `${baseName}-${timestamp}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    publicPath = `/photography/${safeCategory}/${safeName}`;

    return NextResponse.json({
      success: true,
      path: publicPath,
      filename: safeName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed." },
      { status: 500 }
    );
  }
}
