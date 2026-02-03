import { readFile } from "fs/promises";
import path from "path";

export const getMarkdownContentByPath = async (segments: string[]) => {
  const filePath = path.join(process.cwd(), "content", ...segments) + ".md";
  return readFile(filePath, "utf8");
};

export const getMarkdownContent = async (slug: string) =>
  getMarkdownContentByPath([slug]);
