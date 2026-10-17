import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Analytics",
  description: "How this portfolio handles analytics, storage and personal data.",
};

const sectionStyle = { marginTop: 52 } as const;
const headingStyle = { fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 300, letterSpacing: "-0.025em", marginBottom: 18 } as const;
const copyStyle = { fontSize: 17, lineHeight: 1.75, color: "var(--ink-2)", marginBottom: 16 } as const;

export default function PrivacyPage() {
  return (
    <article style={{ padding: "clamp(110px, 16vh, 170px) 0 120px" }}>
      <div className="container" style={{ maxWidth: 850 }}>
        <div className="label">{"// privacy · last updated 17 october 2026"}</div>
        <h1 className="serif" style={{ fontSize: "clamp(52px, 9vw, 104px)", fontWeight: 300, lineHeight: 0.92, letterSpacing: "-0.05em", margin: "18px 0 30px" }}>Privacy, without the fog.</h1>
        <p style={{ ...copyStyle, fontSize: 20, color: "var(--ink)" }}>This is a personal portfolio run by Soham Kakra. I use a small first-party analytics system and Google Analytics only to understand how the site is found and used, and only after you explicitly accept them.</p>

        <section style={sectionStyle}>
          <h2 className="serif" style={headingStyle}>Who is responsible</h2>
          <p style={copyStyle}>Soham Kakra is the data controller for this website. For privacy questions, access requests, deletion requests or withdrawal of consent, email <a href="mailto:sohamkakra@gmail.com" style={{ textDecoration: "underline" }}>sohamkakra@gmail.com</a>.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="serif" style={headingStyle}>What is stored on your device</h2>
          <p style={copyStyle}>Before you choose, no analytics identifier or attribution data is stored. Your choice is saved in local storage as <code>sk-measure</code> for up to six months so the site does not repeatedly ask. This preference is necessary to respect your decision.</p>
          <p style={copyStyle}>If you accept analytics, a random session identifier and first-touch UTM labels are stored in session storage. They disappear when the browser session ends.</p>
          <p style={copyStyle}>If you accept analytics, Google Analytics also sets two cookies on this site&apos;s domain: <code>_ga</code> and <code>_ga_&lt;property ID&gt;</code>. They hold a random client identifier and session state so Google Analytics can tell returning visits apart. Both expire after at most 13 months. If you decline, or later withdraw consent, they are not set, or are deleted from your browser. No advertising or marketing cookies are used, and Google&apos;s advertising features are switched off.</p>
          <p style={copyStyle}>The site does not install an offline service worker or create its own content caches. Your browser may still use its standard HTTP cache to load ordinary website files efficiently.</p>
          <p style={copyStyle}>The <code>admin_session</code> cookie is strictly necessary only for Soham&apos;s private administration area. It is HTTP-only, secure in production, same-site strict, and expires after 30 days. It is not issued to ordinary visitors.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="serif" style={headingStyle}>What analytics collects</h2>
          <p style={copyStyle}>After consent, the site records page paths, visible time, scroll progress, chapters reached, clicks, opened photographs, interaction problems, performance metrics, device category, viewport size, theme, reduced-motion preference, time zone, country supplied by the hosting edge, referring hostname, and the allow-listed UTM fields <code>source</code>, <code>medium</code> and <code>campaign</code>.</p>
          <p style={copyStyle}>The same consent also lets Google Analytics 4 receive page views and the usual measurement fields that its script sends: page address and title, referrer, approximate location derived from the IP address, browser, operating system, screen size, language, and the random client identifier from its cookie. I configure it with Google signals and ad personalisation switched off, and I set the reporting data retention to the shortest period it offers.</p>
          <p style={copyStyle}>It does not record form contents, keystrokes, full referring URLs, search terms, names, email addresses, advertising identifiers or activity on other websites.</p>
          <p style={copyStyle}>This site does not build marketing profiles or make automated decisions about visitors.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="serif" style={headingStyle}>Purpose and legal basis</h2>
          <p style={copyStyle}>The purpose is audience measurement, SEO evaluation, performance monitoring and improving this site&apos;s UX/UI. The legal basis for analytics is your consent under Article 6(1)(a) GDPR and the Dutch rules implementing the ePrivacy Directive. Analytics remains off unless you actively accept.</p>
          <p style={copyStyle}>You may refuse without losing any feature. You may withdraw consent at any time using the “analytics” control in the footer. Your browser&apos;s Global Privacy Control or Do Not Track signal is also treated as a refusal. Withdrawal stops future collection and has no negative consequence.</p>
          <p style={copyStyle}>Hosting, delivering the pages and protecting the site from abuse require limited technical processing. That processing is based on the legitimate interest in operating a secure website under Article 6(1)(f) GDPR.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="serif" style={headingStyle}>Identifiers, security and retention</h2>
          <p style={copyStyle}>The server receives an IP address and user-agent as part of the normal web request. For analytics, the IP is masked before it is combined with the user-agent, a secret salt and the current day. The resulting one-way value is used only for approximate daily unique counts and rate limiting. It rotates daily and the raw IP is not written to the analytics database.</p>
          <p style={copyStyle}>Detailed first-party session records expire after 45 days. Daily aggregate counts expire after 24 months. Google Analytics data is kept for the shortest retention period the property allows. Data is transmitted over HTTPS and the analytics dashboard is restricted to the site administrator.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="serif" style={headingStyle}>Service providers and transfers</h2>
          <p style={copyStyle}>Vercel hosts and delivers the website. Upstash provides the Redis database used for consented first-party analytics. Google Ireland Limited and Google LLC provide Google Analytics, and receive analytics data only after you accept. Google acts as a processor for this data under its measurement data-processing terms, and may transfer it to the United States under the EU Data Privacy Framework and/or Standard Contractual Clauses. They process data under their service terms and the data-processing agreement applicable to the account. Processing may involve the United States or other locations outside the EEA; their published safeguards include the EU Data Privacy Framework and/or Standard Contractual Clauses where applicable.</p>
          <p style={copyStyle}>Vercel also states that it collects end-user IP addresses, IP-derived city and country, and system configuration information as service-generated hosting data. It retains that information only while needed for the purposes described in its own privacy notice, legal obligations and security.</p>
          <p style={copyStyle}><a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Vercel privacy notice</a> · <a href="https://vercel.com/legal/dpa" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Vercel DPA</a> · <a href="https://upstash.com/trust/dpa.pdf" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Upstash DPA</a> · <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>How Google uses data from sites that use its services</a> · <a href="https://business.safety.google/adsprocessorterms/" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Google data processing terms</a></p>
        </section>

        <section style={sectionStyle}>
          <h2 className="serif" style={headingStyle}>Your rights</h2>
          <p style={copyStyle}>Where GDPR applies, you may request access, correction, deletion, restriction, portability, or object to processing, and you may withdraw consent at any time. Because the analytics system does not ask who you are, I may need the session identifier and approximate visit time to locate a record.</p>
          <p style={copyStyle}>You may also complain to the Dutch supervisory authority, the <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Autoriteit Persoonsgegevens</a>.</p>
        </section>
      </div>
    </article>
  );
}
