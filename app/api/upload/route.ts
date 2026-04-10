import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided." },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "No category specified." },
        { status: 400 }
      );
    }

    // Sanitize category slug
    const safeCategory = category.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
    const uploadDir = path.join(process.cwd(), "public", "photography", safeCategory);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sanitize filename
    const ext = path.extname(file.name).toLowerCase();
    const baseName = path
      .basename(file.name, ext)
      .replace(/[^a-z0-9-_]/gi, "-")
      .toLowerCase();
    const timestamp = Date.now();
    const safeName = `${baseName}-${timestamp}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    const publicPath = `/photography/${safeCategory}/${safeName}`;

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
