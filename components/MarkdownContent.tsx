import { markdownToHtml } from "@/lib/markdown";

export default function MarkdownContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}
