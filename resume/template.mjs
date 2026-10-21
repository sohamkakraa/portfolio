import { profile } from "./resume-data.mjs";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function link(url, label = url) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

const icons = {
  location:
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  website:
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  linkedin:
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
};

// Icons are decorative SVG, so text extraction (and applicant tracking systems) still reads plain text.
function icon(name) {
  return `<svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}

function renderContact(phone) {
  const items = [
    ["location", escapeHtml(profile.location)],
    ["email", `<a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>`],
    phone
      ? ["phone", `<a href="tel:${escapeHtml(phone.replaceAll(" ", ""))}">${escapeHtml(phone)}</a>`]
      : null,
    ["website", link(profile.website)],
    ["linkedin", link(profile.linkedin)],
    ["github", link(profile.github)],
  ].filter(Boolean);

  return items.map(([name, item]) => `<span>${icon(name)}${item}</span>`).join("");
}

function renderRole(role) {
  const placeAndDates = [role.location, role.dates].filter(Boolean).join(" · ");
  return `
    <article class="entry">
      <div class="entry-heading">
        <h3>${escapeHtml(role.organization)}</h3>
        <p class="entry-role">${escapeHtml(role.title)}</p>
        <p class="entry-meta">${escapeHtml(placeAndDates)}</p>
      </div>
      <ul>
        ${role.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderAdditionalRole(role) {
  const meta = [role.title, role.location, role.dates].filter(Boolean).join(" · ");
  return `
    <article class="compact-entry">
      <h3>${escapeHtml(role.organization)}</h3>
      <p class="compact-meta">${escapeHtml(meta)}</p>
      <p>${escapeHtml(role.bullets[0])}</p>
    </article>
  `;
}

function renderProject(project) {
  return `
    <article class="project">
      <div class="project-heading">
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(project.label)} · ${link(project.url)}</p>
      </div>
      <p>${escapeHtml(project.description)}</p>
    </article>
  `;
}

function renderEducation(item) {
  const meta = [item.location, item.dates].filter(Boolean).join(" · ");
  return `
    <article class="education-entry">
      <h3>${escapeHtml(item.organization)}</h3>
      <p class="education-degree">${escapeHtml(item.title)}</p>
      <p class="entry-meta">${escapeHtml(meta)}</p>
      <p>${escapeHtml(item.detail)}</p>
    </article>
  `;
}

function renderSkill(skill) {
  return `
    <div class="skill-row">
      <h3>${escapeHtml(skill.label)}</h3>
      <p>${escapeHtml(skill.value)}</p>
    </div>
  `;
}

export function renderResume({ variant, stylesheet, phone = "" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(profile.name)} · Resume</title>
    <style>${stylesheet}</style>
  </head>
  <body>
    <main class="resume ${variant.slug === "master" ? "resume--master" : "resume--tailored"}">
      <header class="masthead">
        <h1>${escapeHtml(profile.name)}</h1>
        <p class="headline">${escapeHtml(variant.headline)}</p>
        <div class="contact" aria-label="Contact details">
          ${renderContact(phone)}
        </div>
        <div class="signal" aria-label="Professional focus">
          ${variant.signal.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
      </header>

      <section aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profile</h2>
        <p class="summary">${escapeHtml(variant.summary)}</p>
      </section>

      <section aria-labelledby="experience-heading">
        <h2 id="experience-heading">Experience</h2>
        ${variant.experience.map(renderRole).join("")}
        ${
          variant.additionalExperience?.length
            ? `<div class="additional-experience" aria-label="Additional experience">
                <h3 class="subsection-title">Additional experience</h3>
                ${variant.additionalExperience.map(renderAdditionalRole).join("")}
              </div>`
            : ""
        }
      </section>

      ${
        variant.projects?.length
          ? `<section aria-labelledby="projects-heading">
              <h2 id="projects-heading">Selected delivery</h2>
              ${variant.projects.map(renderProject).join("")}
            </section>`
          : ""
      }

      <section aria-labelledby="education-heading">
        <h2 id="education-heading">Education</h2>
        <div class="education-grid">
          ${variant.education.map(renderEducation).join("")}
        </div>
      </section>

      <section aria-labelledby="skills-heading">
        <h2 id="skills-heading">Technical skills</h2>
        <div class="skills">
          ${variant.skills.map(renderSkill).join("")}
        </div>
      </section>
    </main>
  </body>
</html>`;
}
