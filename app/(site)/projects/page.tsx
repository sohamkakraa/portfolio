import type { Metadata } from "next";
import ProjectsHoverExpand from "@/components/ProjectsHoverExpand";
import { getPortfolioData } from "@/lib/portfolio-server";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I built, and what each one was actually for.",
};

/**
 * The heading counts the projects out loud, so it has to follow the data. It was once hardcoded to
 * "Six artifacts" over an array of five, which is the kind of miscount a reader checks by scrolling
 * and then stops trusting you about anything else.
 */
function countWord(n: number): string {
  const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  return words[n] ?? String(n);
}

export default async function ProjectsPage() {
  const data = await getPortfolioData();

  return (
    <section style={{ padding: "clamp(96px, 14vh, 160px) 0 120px" }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 56,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <div className="label">{"// projects"}</div>
            <h1
              className="serif"
              style={{
                marginTop: 12,
                fontSize: "clamp(40px, 5.5vw, 72px)",
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
              }}
            >
              {countWord(data.projects.items.length)} artifacts,{" "}
              <em style={{ color: "var(--accent)", fontStyle: "italic" }}>each its own world</em>.
            </h1>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.15em" }}>
            hover to expand
          </div>
        </div>
        <ProjectsHoverExpand items={data.projects.items} />
      </div>
    </section>
  );
}
