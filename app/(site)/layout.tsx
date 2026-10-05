import Nav from "@/components/Nav";
import ContactFooter from "@/components/ContactFooter";
import { getPortfolioData } from "@/lib/portfolio-server";
import "./basecamp.css";

/**
 * Cached, not per-request. The CMS lives in Redis, but forcing dynamic meant every visitor paid for
 * a Redis round trip and a fresh render of pages that change a few times a month. These are cached
 * and revalidated on a timer, and the moment the admin saves, /api/portfolio revalidates them
 * explicitly, so an edit still appears immediately.
 */
export const revalidate = 3600;

/** Every public page: basecamp, the logbook, the lists, places, photos and work. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const data = await getPortfolioData();

  return (
    <div className="bc-shell">
      <a href="#main" className="bc-skip">
        Skip to content
      </a>
      <Nav name={data.site.name} />
      <main id="main">{children}</main>
      <ContactFooter contact={data.contact} footer={data.footer} socials={data.site.socials} />
    </div>
  );
}
