import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Analytics",
  description: "How this portfolio handles analytics, storage and personal data.",
};

const sectionStyle = { marginTop: 48, display: "grid", gap: 14 } as const;
const headingStyle = { fontSize: "clamp(1.4rem, 3vw, 1.9rem)", marginBottom: 2 } as const;
const copyStyle = { margin: 0 } as const;

export default function PrivacyPage() {
  return (
    <article className="bc-wrap">
      <div style={{ maxWidth: 760 }}>
        <header className="bc-page-head">
          <span className="bc-eyebrow">Privacy · last updated 5 October 2026</span>
          <h1 className="bc-h1">Privacy</h1>
          <p className="bc-read bc-lede">This is a personal website run by Soham Kakra. I use a small, first-party analytics system only to understand how the site is found and used, and only after you explicitly accept it. If you send a guess or sign up for a trip, I store only what you type into that form.</p>
        </header>

        <section style={sectionStyle}>
          <h2 className="bc-h2" style={headingStyle}>Who is responsible</h2>
          <p className="bc-read" style={copyStyle}>Soham Kakra is the data controller for this website. For privacy questions, access requests, deletion requests or withdrawal of consent, email <a href="mailto:sohamkakra@gmail.com" style={{ textDecoration: "underline" }}>sohamkakra@gmail.com</a>.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="bc-h2" style={headingStyle}>What is stored on your device</h2>
          <p className="bc-read" style={copyStyle}>Before you choose, no analytics identifier or attribution data is stored. Your choice is saved in local storage as <code>sk-measure</code> for up to six months so the site does not repeatedly ask. This preference is necessary to respect your decision.</p>
          <p className="bc-read" style={copyStyle}>If you accept analytics, a random session identifier and first-touch UTM labels are stored in session storage. They disappear when the browser session ends. Public visitors receive no advertising, marketing or cross-site cookies.</p>
          <p className="bc-read" style={copyStyle}>The site does not install an offline service worker or create its own content caches. Your browser may still use its standard HTTP cache to load ordinary website files efficiently.</p>
          <p className="bc-read" style={copyStyle}>The <code>admin_session</code> cookie is strictly necessary only for Soham&apos;s private administration area. It is HTTP-only, secure in production, same-site strict, and expires after 30 days. It is not issued to ordinary visitors.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="bc-h2" style={headingStyle}>What analytics collects</h2>
          <p className="bc-read" style={copyStyle}>After consent, the site records page paths, visible time, scroll progress, chapters reached, clicks, opened photographs, interaction problems, performance metrics, device category, viewport size, theme, reduced-motion preference, time zone, country supplied by the hosting edge, referring hostname, and the allow-listed UTM fields <code>source</code>, <code>medium</code> and <code>campaign</code>.</p>
          <p className="bc-read" style={copyStyle}>It does not record form contents, keystrokes, full referring URLs, search terms, names, email addresses, advertising identifiers or activity on other websites.</p>
          <p className="bc-read" style={copyStyle}>This site does not build marketing profiles or make automated decisions about visitors.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="bc-h2" style={headingStyle}>Purpose and legal basis</h2>
          <p className="bc-read" style={copyStyle}>The purpose is audience measurement, SEO evaluation, performance monitoring and improving this site&apos;s UX/UI. The legal basis for analytics is your consent under Article 6(1)(a) GDPR and the Dutch rules implementing the ePrivacy Directive. Analytics remains off unless you actively accept.</p>
          <p className="bc-read" style={copyStyle}>You may refuse without losing any feature. You may withdraw consent at any time using the “anonymous analytics” control in the footer. Withdrawal stops future collection and has no negative consequence.</p>
          <p className="bc-read" style={copyStyle}>Hosting, delivering the pages and protecting the site from abuse require limited technical processing. That processing is based on the legitimate interest in operating a secure website under Article 6(1)(f) GDPR.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="bc-h2" style={headingStyle}>Identifiers, security and retention</h2>
          <p className="bc-read" style={copyStyle}>The server receives an IP address and user-agent as part of the normal web request. For analytics, the IP is masked before it is combined with the user-agent, a secret salt and the current day. The resulting one-way value is used only for approximate daily unique counts and rate limiting. It rotates daily and the raw IP is not written to the analytics database.</p>
          <p className="bc-read" style={copyStyle}>Detailed session records expire after 45 days. Daily aggregate counts expire after 24 months. Data is transmitted over HTTPS and the analytics dashboard is restricted to the site administrator.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="bc-h2" style={headingStyle}>Guesses and trip signups</h2>
          <p className="bc-read" style={copyStyle}>On the lists page you can send a guess to one of my open questions. I store the guess, the name you give (optional, it can be anything), the question it answers and the time. Guesses are only shown on the site after I have read and approved them. Unreviewed guesses are deleted automatically after 90 days; approved ones stay until I take them down or you ask me to.</p>
          <p className="bc-read" style={copyStyle}>On the places page you can leave your email for a trip you might want to join. I store the email, the trip and the time, use it only to write to you about that trip, and never show it on the site. Signups for a trip are deleted automatically 24 months after the most recent one, or straight away when you ask.</p>
          <p className="bc-read" style={copyStyle}>The legal basis for both is your consent under Article 6(1)(a) GDPR, given by sending the form. To limit abuse, the server keeps a one-way hash of your IP address and browser for up to one hour to count submissions. The forms do not use analytics, and sending one works the same whatever you chose for analytics.</p>
        </section>

        <section style={sectionStyle}>
          <h2 className="bc-h2" style={headingStyle}>Service providers and transfers</h2>
          <p className="bc-read" style={copyStyle}>Vercel hosts and delivers the website. Upstash provides the Redis database used for consented analytics, guesses and trip signups. They process data under their service terms and the data-processing agreement applicable to the account. Processing may involve the United States or other locations outside the EEA; their published safeguards include the EU Data Privacy Framework and/or Standard Contractual Clauses where applicable.</p>
          <p className="bc-read" style={copyStyle}>Vercel also states that it collects end-user IP addresses, IP-derived city and country, and system configuration information as service-generated hosting data. It retains that information only while needed for the purposes described in its own privacy notice, legal obligations and security.</p>
          <p className="bc-read" style={copyStyle}><a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Vercel privacy notice</a> · <a href="https://vercel.com/legal/dpa" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Vercel DPA</a> · <a href="https://upstash.com/trust/dpa.pdf" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Upstash DPA</a></p>
        </section>

        <section style={sectionStyle}>
          <h2 className="bc-h2" style={headingStyle}>Your rights</h2>
          <p className="bc-read" style={copyStyle}>Where GDPR applies, you may request access, correction, deletion, restriction, portability, or object to processing, and you may withdraw consent at any time. Because the analytics system does not ask who you are, I may need the session identifier and approximate visit time to locate a record.</p>
          <p className="bc-read" style={copyStyle}>You may also complain to the Dutch supervisory authority, the <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Autoriteit Persoonsgegevens</a>.</p>
        </section>
      </div>
    </article>
  );
}
