import Nav from "@/components/Nav";
import ContactFooter from "@/components/ContactFooter";
import GrainOverlay from "@/components/ui/GrainOverlay";
import { getPortfolioData } from "@/lib/portfolio-server";

// The CMS lives in Redis, so these read fresh on every request rather than baking in at build.
export const dynamic = "force-dynamic";

/**
 * The document surfaces: work, projects, photography, about.
 *
 * These are pages you read, so they get the chrome the journey deliberately does without — a nav
 * bar, the paper grain, and one contact footer instead of a contact section repeated per page.
 *
 * The grain used to be drawn in the root layout, which meant the journey pages got it on top of the
 * film grain their scenes already draw: two overlays at different strengths over the same pixels.
 * It belongs to the documents, so it lives here.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const data = await getPortfolioData();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)" }}>
      <GrainOverlay />
      <Nav name={data.site.name} nav={data.site.nav} />
      <main>{children}</main>
      <ContactFooter
        contact={data.contact}
        footer={data.footer}
        socials={data.site.socials}
      />
    </div>
  );
}
