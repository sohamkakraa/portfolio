import { Fragment, type CSSProperties } from "react";

/**
 * Render a string with `{{em}}…{{/em}}` italic-accent markers.
 *
 * Each accented run is wrapped in an <em> with `fontStyle: italic` and the
 * caller-provided color (defaults to var(--accent)). Used by editorial
 * headlines so admins can author italic accents from a plain text input.
 */
export function renderEm(
  text: string | undefined | null,
  options: { color?: string; emStyle?: CSSProperties } = {}
) {
  if (!text) return null;
  const { color = "var(--accent)", emStyle } = options;
  const parts = text.split(/(\{\{em\}\}.*?\{\{\/em\}\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\{\{em\}\}(.*?)\{\{\/em\}\}$/);
        if (m) {
          return (
            <em
              key={i}
              style={{
                fontStyle: "italic",
                color,
                fontWeight: 400,
                ...emStyle,
              }}
            >
              {m[1]}
            </em>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
