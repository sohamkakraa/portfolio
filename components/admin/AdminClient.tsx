"use client";

import { useEffect, useState } from "react";
import type {
  AboutSection,
  ContactSection,
  HighlightItem,
  NavItem,
  PhotographyCategory,
  PhotoItem,
  PhotoMeta,
  PortfolioData,
  ProjectItem,
  SocialLink,
} from "@/lib/portfolio-types";
import {
  clearPortfolioData,
  loadPortfolioData,
  mergePortfolioData,
  savePortfolioData,
  getPortfolioStorageKey,
} from "@/lib/portfolio-storage";
import { readExifMeta } from "@/lib/photo-metadata";

type AdminClientProps = {
  defaultData: PortfolioData;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.round(Math.random() * 1000)}`;
};

const emptyPhotoMeta = (): PhotoMeta => ({
  camera: "",
  lens: "",
  aperture: "",
  shutter: "",
  iso: "",
  focalLength: "",
  date: "",
  location: "",
});

export default function AdminClient({ defaultData }: AdminClientProps) {
  const [data, setData] = useState<PortfolioData>(defaultData);
  const [status, setStatus] = useState<string>("Ready");
  const [error, setError] = useState<string | null>(null);
  const [importPayload, setImportPayload] = useState<string>("");
  const [exportPayload, setExportPayload] = useState<string>("");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const stored = loadPortfolioData();
    if (stored) {
      setData(mergePortfolioData(defaultData, stored));
    }
  }, [defaultData]);

  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }
    setStatus("Unsaved changes");
  }, [data, hasMounted]);

  const handleSave = () => {
    savePortfolioData(data);
    setStatus("Saved to local storage");
    setError(null);
  };

  const handleReset = () => {
    clearPortfolioData();
    setData(defaultData);
    setStatus("Reset to defaults");
    setError(null);
  };

  const handleExport = () => {
    setExportPayload(JSON.stringify(data, null, 2));
    setStatus("Export ready");
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importPayload) as PortfolioData;
      setData(mergePortfolioData(defaultData, parsed));
      setStatus("Imported draft");
      setError(null);
    } catch (err) {
      setError("Invalid JSON. Please check the payload.");
    }
  };

  const updateSite = (field: keyof PortfolioData["site"], value: string | NavItem[] | SocialLink[]) => {
    setData((prev) => ({
      ...prev,
      site: {
        ...prev.site,
        [field]: value,
      },
    }));
  };

  const updateHero = (field: keyof PortfolioData["hero"], value: string | string[] | PortfolioData["hero"]["ctaPrimary"]) => {
    setData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value,
      },
    }));
  };

  const updateAbout = (field: keyof AboutSection, value: string | string[]) => {
    setData((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        [field]: value,
      },
    }));
  };

  const updateHighlights = (field: keyof PortfolioData["highlights"], value: string | HighlightItem[]) => {
    setData((prev) => ({
      ...prev,
      highlights: {
        ...prev.highlights,
        [field]: value,
      },
    }));
  };

  const updateProjects = (field: keyof PortfolioData["projects"], value: string | ProjectItem[]) => {
    setData((prev) => ({
      ...prev,
      projects: {
        ...prev.projects,
        [field]: value,
      },
    }));
  };

  const updatePhotography = (field: keyof PortfolioData["photography"], value: string | PhotographyCategory[]) => {
    setData((prev) => ({
      ...prev,
      photography: {
        ...prev.photography,
        [field]: value,
      },
    }));
  };

  const updateContact = (field: keyof ContactSection, value: string) => {
    setData((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value,
      },
    }));
  };

  const updateFooter = (field: keyof PortfolioData["footer"], value: string | SocialLink[]) => {
    setData((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [field]: value,
      },
    }));
  };

  const updateCategory = (index: number, field: keyof PhotographyCategory, value: string | boolean | PhotoItem[]) => {
    setData((prev) => {
      const categories = [...prev.photography.categories];
      categories[index] = {
        ...categories[index],
        [field]: value,
      };
      return {
        ...prev,
        photography: {
          ...prev.photography,
          categories,
        },
      };
    });
  };

  const updateImage = (
    categoryIndex: number,
    imageIndex: number,
    field: keyof PhotoItem,
    value: string | boolean | PhotoMeta
  ) => {
    setData((prev) => {
      const categories = [...prev.photography.categories];
      const images = [...categories[categoryIndex].images];
      images[imageIndex] = {
        ...images[imageIndex],
        [field]: value,
      };
      categories[categoryIndex] = {
        ...categories[categoryIndex],
        images,
      };
      return {
        ...prev,
        photography: {
          ...prev.photography,
          categories,
        },
      };
    });
  };

  const handleAutoFillMeta = async (categoryIndex: number, imageIndex: number, src: string) => {
    setStatus("Reading image metadata…");
    const meta = await readExifMeta(src);
    if (meta) {
      updateImage(categoryIndex, imageIndex, "meta", {
        ...emptyPhotoMeta(),
        ...meta,
      });
      setStatus("Metadata applied");
    } else {
      setStatus("No metadata found");
    }
  };

  return (
    <div className="admin-surface min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[color:var(--muted)]">Portfolio Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">Edit the entire portfolio with UI controls.</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Saves to local storage key: <span className="font-mono">{getPortfolioStorageKey()}</span>
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.26em] text-[color:var(--muted)]">
            <span>Status: {status}</span>
            {error ? <span className="text-red-500">{error}</span> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full border border-black/10 bg-black px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-black/10 bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
            >
              Reset to defaults
            </button>
            <button
              type="button"
              onClick={() => updatePhotography("categories", defaultData.photography.categories)}
              className="rounded-full border border-black/10 bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
            >
              Sync photos from folders
            </button>
          </div>
        </header>

        <section className="space-y-6">
          <div className="section-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Site settings</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Name
                <input
                  value={data.site.name}
                  onChange={(event) => updateSite("name", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Role
                <input
                  value={data.site.role}
                  onChange={(event) => updateSite("role", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Location
                <input
                  value={data.site.location}
                  onChange={(event) => updateSite("location", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Email
                <input
                  value={data.site.email}
                  onChange={(event) => updateSite("email", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Navigation</p>
                <div className="mt-3 space-y-3">
                  {data.site.nav.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={item.label}
                        onChange={(event) => {
                          const next = [...data.site.nav];
                          next[index] = { ...next[index], label: event.target.value };
                          updateSite("nav", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                      />
                      <input
                        value={item.href}
                        onChange={(event) => {
                          const next = [...data.site.nav];
                          next[index] = { ...next[index], href: event.target.value };
                          updateSite("nav", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = data.site.nav.filter((_, i) => i !== index);
                          updateSite("nav", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-[0.22em]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateSite("nav", [...data.site.nav, { label: "New", href: "#new" }])
                    }
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Add nav item
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Social links</p>
                <div className="mt-3 space-y-3">
                  {data.site.socials.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={item.label}
                        onChange={(event) => {
                          const next = [...data.site.socials];
                          next[index] = { ...next[index], label: event.target.value };
                          updateSite("socials", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                      />
                      <input
                        value={item.href}
                        onChange={(event) => {
                          const next = [...data.site.socials];
                          next[index] = { ...next[index], href: event.target.value };
                          updateSite("socials", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = data.site.socials.filter((_, i) => i !== index);
                          updateSite("socials", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-[0.22em]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateSite("socials", [...data.site.socials, { label: "New", href: "https://" }])
                    }
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Add social
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="section-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Hero</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Eyebrow
                <input
                  value={data.hero.eyebrow}
                  onChange={(event) => updateHero("eyebrow", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Title line 1
                <input
                  value={data.hero.titleLine1}
                  onChange={(event) => updateHero("titleLine1", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Title line 2
                <input
                  value={data.hero.titleLine2}
                  onChange={(event) => updateHero("titleLine2", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                Subtitle
                <textarea
                  value={data.hero.subtitle}
                  onChange={(event) => updateHero("subtitle", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                  rows={3}
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Primary CTA label
                <input
                  value={data.hero.ctaPrimary.label}
                  onChange={(event) =>
                    updateHero("ctaPrimary", { ...data.hero.ctaPrimary, label: event.target.value })
                  }
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Primary CTA link
                <input
                  value={data.hero.ctaPrimary.href}
                  onChange={(event) =>
                    updateHero("ctaPrimary", { ...data.hero.ctaPrimary, href: event.target.value })
                  }
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Secondary CTA label
                <input
                  value={data.hero.ctaSecondary.label}
                  onChange={(event) =>
                    updateHero("ctaSecondary", { ...data.hero.ctaSecondary, label: event.target.value })
                  }
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Secondary CTA link
                <input
                  value={data.hero.ctaSecondary.href}
                  onChange={(event) =>
                    updateHero("ctaSecondary", { ...data.hero.ctaSecondary, href: event.target.value })
                  }
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold">Badges</p>
              {data.hero.badges.map((badge, index) => (
                <div key={`${badge}-${index}`} className="flex gap-3">
                  <input
                    value={badge}
                    onChange={(event) => {
                      const next = [...data.hero.badges];
                      next[index] = event.target.value;
                      updateHero("badges", next);
                    }}
                    className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.hero.badges.filter((_, i) => i !== index);
                      updateHero("badges", next);
                    }}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateHero("badges", [...data.hero.badges, "New badge"])}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
              >
                Add badge
              </button>
            </div>
          </div>

          <div className="section-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold">About</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Title
                <input
                  value={data.about.title}
                  onChange={(event) => updateAbout("title", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Subtitle
                <input
                  value={data.about.subtitle}
                  onChange={(event) => updateAbout("subtitle", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                Body
                <textarea
                  value={data.about.body}
                  onChange={(event) => updateAbout("body", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                  rows={4}
                />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold">Highlights</p>
              {data.about.highlights.map((item, index) => (
                <div key={`${item}-${index}`} className="flex gap-3">
                  <input
                    value={item}
                    onChange={(event) => {
                      const next = [...data.about.highlights];
                      next[index] = event.target.value;
                      updateAbout("highlights", next);
                    }}
                    className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.about.highlights.filter((_, i) => i !== index);
                      updateAbout("highlights", next);
                    }}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateAbout("highlights", [...data.about.highlights, "New highlight"])}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
              >
                Add highlight
              </button>
            </div>
          </div>

          <div className="section-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Highlights</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Section title
                <input
                  value={data.highlights.title}
                  onChange={(event) => updateHighlights("title", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Section description
                <input
                  value={data.highlights.description}
                  onChange={(event) => updateHighlights("description", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
            </div>
            <div className="mt-6 space-y-3">
              {data.highlights.items.map((item, index) => (
                <div key={`${item.title}-${index}`} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                  <input
                    value={item.title}
                    onChange={(event) => {
                      const next = [...data.highlights.items];
                      next[index] = { ...next[index], title: event.target.value };
                      updateHighlights("items", next);
                    }}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                  />
                  <input
                    value={item.description}
                    onChange={(event) => {
                      const next = [...data.highlights.items];
                      next[index] = { ...next[index], description: event.target.value };
                      updateHighlights("items", next);
                    }}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.highlights.items.filter((_, i) => i !== index);
                      updateHighlights("items", next);
                    }}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateHighlights("items", [
                    ...data.highlights.items,
                    { title: "New focus", description: "Add a short description." },
                  ])
                }
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
              >
                Add highlight
              </button>
            </div>
          </div>

          <div className="section-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Projects</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Section title
                <input
                  value={data.projects.title}
                  onChange={(event) => updateProjects("title", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Section description
                <input
                  value={data.projects.description}
                  onChange={(event) => updateProjects("description", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
            </div>
            <div className="mt-6 space-y-4">
              {data.projects.items.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm">
                      Title
                      <input
                        value={item.title}
                        onChange={(event) => {
                          const next = [...data.projects.items];
                          next[index] = { ...next[index], title: event.target.value };
                          updateProjects("items", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm">
                      Year
                      <input
                        value={item.year}
                        onChange={(event) => {
                          const next = [...data.projects.items];
                          next[index] = { ...next[index], year: event.target.value };
                          updateProjects("items", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm md:col-span-2">
                      Summary
                      <textarea
                        value={item.summary}
                        onChange={(event) => {
                          const next = [...data.projects.items];
                          next[index] = { ...next[index], summary: event.target.value };
                          updateProjects("items", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                        rows={3}
                      />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <label className="flex flex-col gap-2 text-sm">
                      Tags (comma separated)
                      <input
                        value={item.tags.join(", ")}
                        onChange={(event) => {
                          const next = [...data.projects.items];
                          next[index] = {
                            ...next[index],
                            tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                          };
                          updateProjects("items", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm">
                      Status
                      <input
                        value={item.status || ""}
                        onChange={(event) => {
                          const next = [...data.projects.items];
                          next[index] = { ...next[index], status: event.target.value };
                          updateProjects("items", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm">
                      Link
                      <input
                        value={item.link || ""}
                        onChange={(event) => {
                          const next = [...data.projects.items];
                          next[index] = { ...next[index], link: event.target.value };
                          updateProjects("items", next);
                        }}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const next = data.projects.items.filter((_, i) => i !== index);
                        updateProjects("items", next);
                      }}
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
                    >
                      Remove project
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateProjects("items", [
                    ...data.projects.items,
                    {
                      id: createId(),
                      title: "New project",
                      summary: "Describe the project.",
                      tags: ["New"],
                      year: new Date().getFullYear().toString(),
                      status: "Draft",
                      link: "",
                    },
                  ])
                }
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
              >
                Add project
              </button>
            </div>
          </div>

          <div className="section-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Photography</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Auto fill uses `/public/photography/metadata.json` when available. Manual edits here always take
              priority.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Section title
                <input
                  value={data.photography.title}
                  onChange={(event) => updatePhotography("title", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Section description
                <input
                  value={data.photography.description}
                  onChange={(event) => updatePhotography("description", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
            </div>

            <div className="mt-6 space-y-6">
              {data.photography.categories.map((category, categoryIndex) => (
                <div key={category.slug} className="rounded-2xl border border-black/10 bg-white/80 p-5">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <label className="flex flex-col gap-2 text-sm">
                      Slug
                      <input
                        value={category.slug}
                        onChange={(event) => updateCategory(categoryIndex, "slug", event.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm">
                      Title
                      <input
                        value={category.title}
                        onChange={(event) => updateCategory(categoryIndex, "title", event.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm">
                      Accent
                      <input
                        value={category.accent}
                        onChange={(event) => updateCategory(categoryIndex, "accent", event.target.value)}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                      <input
                        type="checkbox"
                        checked={!!category.hidden}
                        onChange={(event) => updateCategory(categoryIndex, "hidden", event.target.checked)}
                      />
                      Hidden
                    </label>
                  </div>
                  <label className="mt-3 flex flex-col gap-2 text-sm">
                    Description
                    <input
                      value={category.description}
                      onChange={(event) => updateCategory(categoryIndex, "description", event.target.value)}
                      className="rounded-xl border border-black/10 bg-white px-4 py-2"
                    />
                  </label>

                  <div className="mt-4 space-y-4">
                    <p className="text-sm font-semibold">Images</p>
                    {category.images.map((image, imageIndex) => (
                      <div key={image.id} className="rounded-2xl border border-black/10 bg-white p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="flex flex-col gap-2 text-sm">
                            Image src
                            <input
                              value={image.src}
                              onChange={(event) =>
                                updateImage(categoryIndex, imageIndex, "src", event.target.value)
                              }
                              className="rounded-xl border border-black/10 bg-white px-4 py-2"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-sm">
                            Title
                            <input
                              value={image.title}
                              onChange={(event) =>
                                updateImage(categoryIndex, imageIndex, "title", event.target.value)
                              }
                              className="rounded-xl border border-black/10 bg-white px-4 py-2"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-sm md:col-span-2">
                            Description
                            <textarea
                              value={image.description}
                              onChange={(event) =>
                                updateImage(categoryIndex, imageIndex, "description", event.target.value)
                              }
                              className="rounded-xl border border-black/10 bg-white px-4 py-2"
                              rows={2}
                            />
                          </label>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em]">
                          <label className="flex items-center gap-2 text-[color:var(--muted)]">
                            <input
                              type="checkbox"
                              checked={!!image.hidden}
                              onChange={(event) =>
                                updateImage(categoryIndex, imageIndex, "hidden", event.target.checked)
                              }
                            />
                            Hidden
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAutoFillMeta(categoryIndex, imageIndex, image.src)}
                            className="rounded-full border border-black/10 bg-white px-3 py-2 text-[10px] uppercase tracking-[0.24em]"
                          >
                            Auto fill metadata
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {Object.entries({ ...(image.meta || emptyPhotoMeta()) }).map(([key, value]) => (
                            <label key={key} className="flex flex-col gap-2 text-sm">
                              {key}
                              <input
                                value={value || ""}
                                onChange={(event) => {
                                  const meta = { ...(image.meta || emptyPhotoMeta()), [key]: event.target.value };
                                  updateImage(categoryIndex, imageIndex, "meta", meta);
                                }}
                                className="rounded-xl border border-black/10 bg-white px-4 py-2"
                              />
                            </label>
                          ))}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const nextImages = category.images.filter((_, i) => i !== imageIndex);
                              updateCategory(categoryIndex, "images", nextImages);
                            }}
                            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
                          >
                            Remove image
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const nextImages = [
                          ...category.images,
                          {
                            id: createId(),
                            src: "/photography/category/image.jpg",
                            title: "New image",
                            description: "Add a description.",
                            meta: emptyPhotoMeta(),
                          },
                        ];
                        updateCategory(categoryIndex, "images", nextImages);
                      }}
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
                    >
                      Add image
                    </button>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const nextCategories = data.photography.categories.filter((_, i) => i !== categoryIndex);
                        updatePhotography("categories", nextCategories);
                      }}
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
                    >
                      Remove category
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updatePhotography("categories", [
                    ...data.photography.categories,
                    {
                      slug: "new-category",
                      title: "New category",
                      description: "Describe the collection.",
                      accent: "#0a63ff",
                      images: [],
                    },
                  ])
                }
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
              >
                Add category
              </button>
            </div>
          </div>

          <div className="section-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Contact + footer</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Contact title
                <input
                  value={data.contact.title}
                  onChange={(event) => updateContact("title", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Contact CTA label
                <input
                  value={data.contact.ctaLabel}
                  onChange={(event) => updateContact("ctaLabel", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                Contact description
                <textarea
                  value={data.contact.description}
                  onChange={(event) => updateContact("description", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                  rows={3}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Contact email
                <input
                  value={data.contact.email}
                  onChange={(event) => updateContact("email", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex flex-col gap-2 text-sm">
                Footer note
                <input
                  value={data.footer.note}
                  onChange={(event) => updateFooter("note", event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2"
                />
              </label>
              <p className="text-sm font-semibold">Footer links</p>
              {data.footer.links.map((item, index) => (
                <div key={`${item.label}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const next = [...data.footer.links];
                      next[index] = { ...next[index], label: event.target.value };
                      updateFooter("links", next);
                    }}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                  />
                  <input
                    value={item.href}
                    onChange={(event) => {
                      const next = [...data.footer.links];
                      next[index] = { ...next[index], href: event.target.value };
                      updateFooter("links", next);
                    }}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = data.footer.links.filter((_, i) => i !== index);
                      updateFooter("links", next);
                    }}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateFooter("links", [...data.footer.links, { label: "New link", href: "/admin" }])
                }
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em]"
              >
                Add footer link
              </button>
            </div>
          </div>

          <div className="section-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Import / Export</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleExport}
                  className="rounded-full border border-black/10 bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
                >
                  Generate export JSON
                </button>
                <textarea
                  value={exportPayload}
                  readOnly
                  className="h-64 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs"
                />
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-full border border-black/10 bg-black px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white"
                >
                  Import JSON
                </button>
                <textarea
                  value={importPayload}
                  onChange={(event) => setImportPayload(event.target.value)}
                  placeholder="Paste JSON here."
                  className="h-64 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
