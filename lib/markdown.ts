const linkClass =
  "text-neutral-900 underline underline-offset-4 decoration-black/20 hover:decoration-black/40 dark:text-neutral-100 dark:decoration-white/20 dark:hover:decoration-white/40";

const codeClass =
  "rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.85em] text-neutral-700 dark:bg-white/10 dark:text-neutral-200";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatInline = (value: string) => {
  let output = escapeHtml(value);
  output = output.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a class="${linkClass}" href="$2">$1</a>`
  );
  output = output.replace(/`([^`]+)`/g, `<code class="${codeClass}">$1</code>`);
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return output;
};

export const markdownToHtml = (markdown: string) => {
  const lines = markdown.split(/\r?\n/);
  const chunks: string[] = [];
  let inList = false;

  const closeList = () => {
    if (!inList) return;
    chunks.push("</ul>");
    inList = false;
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      chunks.push(
        `<h3 class="mt-10 text-base font-semibold text-neutral-900 dark:text-neutral-100">${formatInline(
          line.slice(4)
        )}</h3>`
      );
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      chunks.push(
        `<h2 class="mt-10 text-xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100">${formatInline(
          line.slice(3)
        )}</h2>`
      );
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      chunks.push(
        `<h1 class="mt-10 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">${formatInline(
          line.slice(2)
        )}</h1>`
      );
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        chunks.push('<ul class="mt-4 space-y-2 pl-4 text-sm text-neutral-600 dark:text-neutral-300">');
        inList = true;
      }
      chunks.push(`<li class="list-disc">${formatInline(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    chunks.push(
      `<p class="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">${formatInline(
        line
      )}</p>`
    );
  }

  closeList();
  return chunks.join("");
};
