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

function renderContact(phone) {
  const items = [
    `<a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>`,
    phone ? `<a href="tel:${escapeHtml(phone.replaceAll(" ", ""))}">${escapeHtml(phone)}</a>` : "",
    link(profile.website),
    link(profile.linkedin),
    link(profile.github),
  ].filter(Boolean);

  return items.map((item) => `<span>${item}</span>`).join("");
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
    <title>${escapeHtml(profile.name)} — Resume</title>
    <style>${stylesheet}</style>
  </head>
  <body>
    <main class="resume ${variant.slug === "master" ? "resume--master" : "resume--tailored"}">
      <header class="masthead">
        <h1>${escapeHtml(profile.name)}</h1>
        <p class="headline">${escapeHtml(variant.headline)}</p>
        <div class="contact" aria-label="Contact details">
          <span>${escapeHtml(profile.location)}</span>
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
