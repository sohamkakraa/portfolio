"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  Compass,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Layout,
  Loader2,
  Lock,
  Plus,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import type {
  AboutSection,
  ContactSection,
  LifeBook,
  LifeEntertainment,
  LifePlace,
  LifeSection,
  LifeSnapshot,
  PhotographyCategory,
  PhotoItem,
  PhotoMeta,
  PortfolioData,
  ProjectItem,
} from "@/lib/portfolio-types";
import ImageCropDialog from "@/components/admin/ImageCropDialog";

type AdminPanelProps = {
  defaultData: PortfolioData;
};

const ADMIN_PASSWORD = "soham2026";

const TABS = [
  { id: "site", label: "Site", icon: Globe },
  { id: "hero", label: "Hero", icon: Layout },
  { id: "about", label: "About", icon: User },
  { id: "highlights", label: "Highlights", icon: Sparkles },
  { id: "projects", label: "Projects", icon: FileText },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "life", label: "Beyond work", icon: Compass },
  { id: "contact", label: "Contact", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.round(Math.random() * 1e4)}`;
};

const emptyPhotoMeta = (): PhotoMeta => ({
  camera: "", lens: "", aperture: "", shutter: "", iso: "", focalLength: "", date: "", location: "",
});

/* ── Tiny reusable components ── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--fg-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y"
    />
  );
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
      {title && (
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-[color:var(--fg)]">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function DangerButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-red-400 transition hover:bg-red-500/20"
    >
      {children}
    </button>
  );
}

/* ── Main Admin Panel ── */

export default function AdminPanel({ defaultData }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [data, setData] = useState<PortfolioData>(defaultData);
  const [activeTab, setActiveTab] = useState<TabId>("site");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [assetUploadHint, setAssetUploadHint] = useState<string | null>(null);
  const [photoDropSlug, setPhotoDropSlug] = useState<string | null>(null);
  const [aboutDropActive, setAboutDropActive] = useState(false);
  const [bookDropIndex, setBookDropIndex] = useState<number | null>(null);
  const [photoUploadBusy, setPhotoUploadBusy] = useState(false);
  const assetHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [crop, setCrop] = useState<{
    src: string;
    aspect: number;
    scope: "about" | "books";
    bookIndex?: number;
  } | null>(null);

  const showAssetHint = useCallback((text: string) => {
    if (assetHintTimer.current) clearTimeout(assetHintTimer.current);
    setAssetUploadHint(text);
    assetHintTimer.current = setTimeout(() => {
      setAssetUploadHint(null);
      assetHintTimer.current = null;
    }, 6000);
  }, []);

  useEffect(
    () => () => {
      if (assetHintTimer.current) clearTimeout(assetHintTimer.current);
    },
    []
  );

  // Load data from API on mount (avoid cached JSON so new uploads / saves show up immediately)
  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/portfolio", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((loaded: PortfolioData) => setData(loaded))
      .catch(() => {
        showAssetHint("Could not load portfolio from the server. Using defaults until refresh.");
      });
  }, [authenticated, showAssetHint]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleSave = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        // Also save to localStorage for immediate frontend updates
        if (typeof window !== "undefined") {
          window.localStorage.setItem("portfolio-data-v2", JSON.stringify(data));
        }
        setStatus("saved");
        setStatusMessage("Saved successfully!");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        const errBody = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errBody?.message || "Save failed");
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Save failed";
      setStatus("error");
      setStatusMessage(
        `Could not save on server. ${detail} — stored in this browser only (localStorage).`
      );
      if (typeof window !== "undefined") {
        window.localStorage.setItem("portfolio-data-v2", JSON.stringify(data));
      }
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  // ── Updaters ──

  const updateSite = (field: keyof PortfolioData["site"], value: unknown) => {
    setData((prev) => ({ ...prev, site: { ...prev.site, [field]: value } }));
  };

  const updateHero = (field: keyof PortfolioData["hero"], value: unknown) => {
    setData((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  };

  const updateAbout = (field: keyof AboutSection, value: unknown) => {
    setData((prev) => ({ ...prev, about: { ...prev.about, [field]: value } }));
  };

  const updateHighlights = (field: keyof PortfolioData["highlights"], value: unknown) => {
    setData((prev) => ({ ...prev, highlights: { ...prev.highlights, [field]: value } }));
  };

  const updateProjects = (field: keyof PortfolioData["projects"], value: unknown) => {
    setData((prev) => ({ ...prev, projects: { ...prev.projects, [field]: value } }));
  };

  const updatePhotography = (field: keyof PortfolioData["photography"], value: unknown) => {
    setData((prev) => ({ ...prev, photography: { ...prev.photography, [field]: value } }));
  };

  const updateContact = (field: keyof ContactSection, value: string) => {
    setData((prev) => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
  };

  const updateLife = (field: keyof LifeSection, value: unknown) => {
    setData((prev) => ({ ...prev, life: { ...prev.life, [field]: value } }));
  };

  const closeCrop = () => {
    if (crop?.src.startsWith("blob:")) URL.revokeObjectURL(crop.src);
    setCrop(null);
  };

  const handleCroppedFile = async (file: File) => {
    if (!crop) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("scope", crop.scope === "about" ? "about" : "books");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const raw = await res.text();
    let result: { success?: boolean; path?: string; message?: string } = {};
    try {
      result = raw ? (JSON.parse(raw) as typeof result) : {};
    } catch {
      showAssetHint(
        `Upload response was not JSON (${res.status}). ${raw.slice(0, 120).replace(/\s+/g, " ").trim() || res.statusText}`
      );
      return;
    }
    if (!res.ok || !result.success || !result.path) {
      showAssetHint(result.message || `Upload failed (${res.status}). Cropped image was not saved.`);
      return;
    }
    if (crop.scope === "about") {
      setData((prev) => ({
        ...prev,
        about: { ...prev.about, portraitSrc: result.path },
      }));
      showAssetHint("Portrait uploaded. Click Save so it persists on the server.");
    } else if (crop.bookIndex !== undefined) {
      setData((prev) => {
        const books = [...prev.life.books];
        const b = books[crop.bookIndex!];
        if (b) books[crop.bookIndex!] = { ...b, coverSrc: result.path };
        return { ...prev, life: { ...prev.life, books } };
      });
      showAssetHint("Book cover uploaded. Click Save so it persists on the server.");
    }
  };

  const openAboutCrop = (file: File) => {
    setCrop({ src: URL.createObjectURL(file), aspect: 3 / 4, scope: "about" });
  };

  const openBookCrop = (bookIndex: number, file: File) => {
    setCrop({
      src: URL.createObjectURL(file),
      aspect: 2 / 3,
      scope: "books",
      bookIndex,
    });
  };

  const updateCategory = (idx: number, field: keyof PhotographyCategory, value: unknown) => {
    setData((prev) => {
      const cats = [...prev.photography.categories];
      cats[idx] = { ...cats[idx], [field]: value };
      return { ...prev, photography: { ...prev.photography, categories: cats } };
    });
  };

  const updateProject = (idx: number, field: keyof ProjectItem, value: unknown) => {
    setData((prev) => {
      const items = [...prev.projects.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, projects: { ...prev.projects, items } };
    });
  };

  const addProject = () => {
    const newProject: ProjectItem = {
      id: createId(),
      title: "New Project",
      summary: "",
      tags: [],
      year: new Date().getFullYear().toString(),
      status: "In progress",
    };
    setData((prev) => ({
      ...prev,
      projects: { ...prev.projects, items: [...prev.projects.items, newProject] },
    }));
  };

  const removeProject = (idx: number) => {
    setData((prev) => ({
      ...prev,
      projects: { ...prev.projects, items: prev.projects.items.filter((_, i) => i !== idx) },
    }));
  };

  const addCategory = () => {
    const newCat: PhotographyCategory = {
      slug: `category-${Date.now()}`,
      title: "New Category",
      description: "",
      accent: "#818cf8",
      images: [],
    };
    setData((prev) => ({
      ...prev,
      photography: {
        ...prev.photography,
        categories: [...prev.photography.categories, newCat],
      },
    }));
  };

  const removeCategory = (idx: number) => {
    setData((prev) => ({
      ...prev,
      photography: {
        ...prev.photography,
        categories: prev.photography.categories.filter((_, i) => i !== idx),
      },
    }));
  };

  // ── Image upload ──

  const handleImageUpload = async (categorySlug: string, categoryIdx: number, files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      showAssetHint("Only image files are accepted (e.g. JPEG, PNG, WebP).");
      return;
    }
    setPhotoUploadBusy(true);
    const additions: PhotoItem[] = [];
    const failures: string[] = [];
    try {
    for (const file of list) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", categorySlug);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const raw = await res.text();
        let result: { success?: boolean; path?: string; message?: string } = {};
        try {
          result = raw ? (JSON.parse(raw) as typeof result) : {};
        } catch {
          failures.push(
            `${file.name}: Bad response (${res.status}). ${raw.slice(0, 100).replace(/\s+/g, " ").trim() || res.statusText}`
          );
          continue;
        }
        if (!res.ok || !result.success || !result.path) {
          failures.push(
            `${file.name}: ${result.message || (!res.ok ? `HTTP ${res.status}` : "Server rejected upload")}`
          );
          continue;
        }
        additions.push({
          id: createId(),
          src: result.path,
          title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          description: "",
          meta: emptyPhotoMeta(),
        });
      } catch {
        failures.push(`${file.name}: Network error`);
      }
    }
    if (additions.length) {
      setData((prev) => {
        const cats = [...prev.photography.categories];
        const cat = cats[categoryIdx];
        if (!cat) return prev;
        cats[categoryIdx] = {
          ...cat,
          images: [...cat.images, ...additions],
        };
        return { ...prev, photography: { ...prev.photography, categories: cats } };
      });
      showAssetHint(
        `Added ${additions.length} image(s). Click Save so they persist${failures.length ? ` (${failures.length} failed).` : "."}`
      );
    } else if (failures.length) {
      showAssetHint(`Upload failed: ${failures.slice(0, 3).join(" ")}${failures.length > 3 ? " …" : ""}`);
    }
    } finally {
      setPhotoUploadBusy(false);
    }
  };

  // ── Password gate ──

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--bg)] p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
              <Lock size={28} className="text-[color:var(--accent)]" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[color:var(--fg)]">
              Admin Panel
            </h1>
            <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
              Enter your password to access the CMS.
            </p>
          </div>
          <div className="admin-surface space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className={`w-full ${passwordError ? "!border-red-500" : ""}`}
            />
            {passwordError && (
              <p className="text-xs text-red-400">Incorrect password. Try again.</p>
            )}
            <button type="button" onClick={handleLogin} className="btn-primary w-full justify-center">
              <span>Enter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main admin UI ──

  return (
    <div className="min-h-screen bg-[color:var(--bg)] admin-surface">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold tracking-[0.15em] uppercase text-[color:var(--fg)]">
              Soham Kakra
            </Link>
            <span className="rounded-full bg-[color:var(--accent)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--accent)]">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            {status !== "idle" && (
              <span
                className={`text-xs font-medium ${
                  status === "saving"
                    ? "text-amber-400"
                    : status === "saved"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {status === "saving" && <Loader2 size={12} className="mr-1 inline animate-spin" />}
                {status === "saved" && <Check size={12} className="mr-1 inline" />}
                {statusMessage}
              </span>
            )}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary !py-2 !px-4 !text-[10px]"
            >
              <Eye size={12} /> Preview
            </a>
            <button type="button" onClick={handleSave} className="btn-primary !py-2 !px-5 !text-[10px]">
              <Save size={12} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {assetUploadHint ? (
        <div
          className="border-b border-amber-500/25 bg-amber-500/10 px-6 py-2.5 text-center text-xs font-medium text-amber-100/95"
          role="status"
        >
          {assetUploadHint}
        </div>
      ) : null}

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        {/* Sidebar tabs */}
        <aside className="sticky top-20 hidden w-56 shrink-0 space-y-1 self-start lg:block">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                activeTab === id
                  ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                  : "text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] hover:bg-[color:var(--bg-surface)]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </aside>

        {/* Mobile tabs */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-1 overflow-x-auto border-t border-[color:var(--border)] bg-[color:var(--bg)] p-2 lg:hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-medium ${
                activeTab === id
                  ? "text-[color:var(--accent)]"
                  : "text-[color:var(--fg-muted)]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <main className="min-w-0 flex-1 space-y-6 pb-24 lg:pb-8">
          {/* ── Site Settings ── */}
          {activeTab === "site" && (
            <>
              <Card title="Site Settings">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <Input value={data.site.name} onChange={(v) => updateSite("name", v)} />
                  </Field>
                  <Field label="Role">
                    <Input value={data.site.role} onChange={(v) => updateSite("role", v)} />
                  </Field>
                  <Field label="Location">
                    <Input value={data.site.location} onChange={(v) => updateSite("location", v)} />
                  </Field>
                  <Field label="Email">
                    <Input value={data.site.email} onChange={(v) => updateSite("email", v)} />
                  </Field>
                </div>
              </Card>

              <Card title="Navigation Links">
                <div className="space-y-3">
                  {data.site.nav.map((item, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input
                        className="flex-1"
                        value={item.label}
                        onChange={(e) => {
                          const nav = [...data.site.nav];
                          nav[i] = { ...nav[i], label: e.target.value };
                          updateSite("nav", nav);
                        }}
                        placeholder="Label"
                      />
                      <input
                        className="flex-1"
                        value={item.href}
                        onChange={(e) => {
                          const nav = [...data.site.nav];
                          nav[i] = { ...nav[i], href: e.target.value };
                          updateSite("nav", nav);
                        }}
                        placeholder="URL"
                      />
                      <DangerButton
                        onClick={() => {
                          const nav = data.site.nav.filter((_, j) => j !== i);
                          updateSite("nav", nav);
                        }}
                      >
                        <Trash2 size={12} />
                      </DangerButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateSite("nav", [...data.site.nav, { label: "", href: "" }])}
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add Link
                  </button>
                </div>
              </Card>

              <Card title="Social Links">
                <div className="space-y-3">
                  {data.site.socials.map((item, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input
                        className="w-32"
                        value={item.label}
                        onChange={(e) => {
                          const socials = [...data.site.socials];
                          socials[i] = { ...socials[i], label: e.target.value };
                          updateSite("socials", socials);
                        }}
                        placeholder="Label"
                      />
                      <input
                        className="flex-1"
                        value={item.href}
                        onChange={(e) => {
                          const socials = [...data.site.socials];
                          socials[i] = { ...socials[i], href: e.target.value };
                          updateSite("socials", socials);
                        }}
                        placeholder="URL"
                      />
                      <DangerButton
                        onClick={() => updateSite("socials", data.site.socials.filter((_, j) => j !== i))}
                      >
                        <Trash2 size={12} />
                      </DangerButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateSite("socials", [...data.site.socials, { label: "", href: "" }])}
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add Social
                  </button>
                </div>
              </Card>
            </>
          )}

          {/* ── Hero ── */}
          {activeTab === "hero" && (
            <Card title="Hero Section">
              <div className="space-y-4">
                <Field label="Eyebrow text">
                  <Input value={data.hero.eyebrow} onChange={(v) => updateHero("eyebrow", v)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Title Line 1">
                    <Input value={data.hero.titleLine1} onChange={(v) => updateHero("titleLine1", v)} />
                  </Field>
                  <Field label="Title Line 2 (gradient)">
                    <Input value={data.hero.titleLine2} onChange={(v) => updateHero("titleLine2", v)} />
                  </Field>
                </div>
                <Field label="Subtitle">
                  <TextArea value={data.hero.subtitle} onChange={(v) => updateHero("subtitle", v)} />
                </Field>

                <label className="flex cursor-pointer items-center gap-2 pt-2 text-xs text-[color:var(--fg-muted)]">
                  <input
                    type="checkbox"
                    checked={data.hero.showVivekaCta !== false}
                    onChange={(e) => updateHero("showVivekaCta", e.target.checked)}
                    className="rounded border-[color:var(--border)]"
                  />
                  Show third CTA (Viveka) in hero and about
                </label>

                <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-4">
                  Call to Actions
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Primary CTA Label">
                    <Input
                      value={data.hero.ctaPrimary.label}
                      onChange={(v) => updateHero("ctaPrimary", { ...data.hero.ctaPrimary, label: v })}
                    />
                  </Field>
                  <Field label="Primary CTA Link">
                    <Input
                      value={data.hero.ctaPrimary.href}
                      onChange={(v) => updateHero("ctaPrimary", { ...data.hero.ctaPrimary, href: v })}
                    />
                  </Field>
                  <Field label="Secondary CTA Label">
                    <Input
                      value={data.hero.ctaSecondary.label}
                      onChange={(v) => updateHero("ctaSecondary", { ...data.hero.ctaSecondary, label: v })}
                    />
                  </Field>
                  <Field label="Secondary CTA Link">
                    <Input
                      value={data.hero.ctaSecondary.href}
                      onChange={(v) => updateHero("ctaSecondary", { ...data.hero.ctaSecondary, href: v })}
                    />
                  </Field>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-4">
                  Viveka CTA
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Label">
                    <Input
                      value={data.hero.vivekaCta?.label ?? ""}
                      onChange={(v) =>
                        updateHero("vivekaCta", {
                          label: v,
                          href: data.hero.vivekaCta?.href ?? "https://viveka.sohamkakra.com",
                        })
                      }
                    />
                  </Field>
                  <Field label="URL">
                    <Input
                      value={data.hero.vivekaCta?.href ?? ""}
                      onChange={(v) =>
                        updateHero("vivekaCta", {
                          label: data.hero.vivekaCta?.label ?? "Viveka",
                          href: v,
                        })
                      }
                    />
                  </Field>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-4">
                  Badges
                </h4>
                <div className="space-y-2">
                  {data.hero.badges.map((badge, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        className="flex-1"
                        value={badge}
                        onChange={(e) => {
                          const badges = [...data.hero.badges];
                          badges[i] = e.target.value;
                          updateHero("badges", badges);
                        }}
                      />
                      <DangerButton onClick={() => updateHero("badges", data.hero.badges.filter((_, j) => j !== i))}>
                        <X size={12} />
                      </DangerButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateHero("badges", [...data.hero.badges, ""])}
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add Badge
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* ── About ── */}
          {activeTab === "about" && (
            <Card title="About Section">
              <div className="space-y-4">
                <Field label="Section Title">
                  <Input value={data.about.title} onChange={(v) => updateAbout("title", v)} />
                </Field>
                <Field label="Subtitle">
                  <Input value={data.about.subtitle} onChange={(v) => updateAbout("subtitle", v)} />
                </Field>
                <Field label="Body">
                  <TextArea value={data.about.body} onChange={(v) => updateAbout("body", v)} rows={5} />
                </Field>
                <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-2">
                  Highlights
                </h4>
                {data.about.highlights.map((h, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="flex-1"
                      value={h}
                      onChange={(e) => {
                        const hl = [...data.about.highlights];
                        hl[i] = e.target.value;
                        updateAbout("highlights", hl);
                      }}
                    />
                    <DangerButton onClick={() => updateAbout("highlights", data.about.highlights.filter((_, j) => j !== i))}>
                      <X size={12} />
                    </DangerButton>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateAbout("highlights", [...data.about.highlights, ""])}
                  className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                >
                  <Plus size={12} /> Add Highlight
                </button>

                <Field label="Portrait photo">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {data.about.portraitSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={data.about.portraitSrc}
                        src={data.about.portraitSrc}
                        alt=""
                        className="h-28 w-24 shrink-0 rounded-xl border border-[color:var(--border)] object-cover"
                      />
                    ) : (
                      <span className="text-xs text-[color:var(--fg-muted)]">Using default /Me.jpg on site.</span>
                    )}
                    <div
                      className={`flex min-h-[120px] flex-1 flex-col justify-center rounded-xl border-2 border-dashed px-4 py-4 transition ${
                        aboutDropActive
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10"
                          : "border-[color:var(--border)] bg-[color:var(--bg-elevated)]"
                      }`}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAboutDropActive(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "copy";
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        const next = e.relatedTarget as Node | null;
                        if (next && e.currentTarget.contains(next)) return;
                        setAboutDropActive(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAboutDropActive(false);
                        const f = Array.from(e.dataTransfer.files).find((file) => file.type.startsWith("image/"));
                        if (f) openAboutCrop(f);
                        else showAssetHint("Drop a JPEG, PNG, or WebP file for the portrait.");
                      }}
                    >
                      <input
                        id="about-portrait-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) openAboutCrop(f);
                          e.target.value = "";
                        }}
                      />
                      <p className="text-sm text-[color:var(--fg-muted)]">
                        <label htmlFor="about-portrait-file" className="cursor-pointer font-medium text-[color:var(--accent)] hover:underline">
                          Choose file
                        </label>
                        {" · "}
                        or drag an image here
                      </p>
                      <p className="mt-2 text-[11px] text-[color:var(--fg-muted)]">
                        Opens a 3:4 crop dialog, then uploads to /about/. Remember to Save.
                      </p>
                    </div>
                  </div>
                </Field>
              </div>
            </Card>
          )}

          {/* ── Highlights ── */}
          {activeTab === "highlights" && (
            <Card title="Highlights Section">
              <div className="space-y-4">
                <Field label="Section Title">
                  <Input value={data.highlights.title} onChange={(v) => updateHighlights("title", v)} />
                </Field>
                <Field label="Description">
                  <Input value={data.highlights.description} onChange={(v) => updateHighlights("description", v)} />
                </Field>
                <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-2">
                  Items
                </h4>
                {data.highlights.items.map((item, i) => (
                  <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[color:var(--fg-muted)]">Item {i + 1}</span>
                      <DangerButton onClick={() => updateHighlights("items", data.highlights.items.filter((_, j) => j !== i))}>
                        <Trash2 size={12} />
                      </DangerButton>
                    </div>
                    <input
                      className="w-full"
                      value={item.title}
                      onChange={(e) => {
                        const items = [...data.highlights.items];
                        items[i] = { ...items[i], title: e.target.value };
                        updateHighlights("items", items);
                      }}
                      placeholder="Title"
                    />
                    <textarea
                      className="w-full resize-y"
                      value={item.description}
                      onChange={(e) => {
                        const items = [...data.highlights.items];
                        items[i] = { ...items[i], description: e.target.value };
                        updateHighlights("items", items);
                      }}
                      placeholder="Description"
                      rows={2}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateHighlights("items", [
                      ...data.highlights.items,
                      { title: "", description: "" },
                    ])
                  }
                  className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                >
                  <Plus size={12} /> Add Item
                </button>
              </div>
            </Card>
          )}

          {/* ── Projects ── */}
          {activeTab === "projects" && (
            <>
              <Card title="Projects Section">
                <div className="space-y-4">
                  <Field label="Section Title">
                    <Input value={data.projects.title} onChange={(v) => updateProjects("title", v)} />
                  </Field>
                  <Field label="Description">
                    <TextArea value={data.projects.description} onChange={(v) => updateProjects("description", v)} />
                  </Field>
                </div>
              </Card>

              {data.projects.items.map((project, i) => (
                <Card key={project.id} title={project.title || `Project ${i + 1}`}>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Title">
                        <Input value={project.title} onChange={(v) => updateProject(i, "title", v)} />
                      </Field>
                      <Field label="Year">
                        <Input value={project.year} onChange={(v) => updateProject(i, "year", v)} />
                      </Field>
                      <Field label="Status">
                        <Input value={project.status || ""} onChange={(v) => updateProject(i, "status", v)} />
                      </Field>
                      <Field label="Link">
                        <Input value={project.link || ""} onChange={(v) => updateProject(i, "link", v)} />
                      </Field>
                    </div>
                    <Field label="Summary">
                      <TextArea value={project.summary} onChange={(v) => updateProject(i, "summary", v)} />
                    </Field>
                    <Field label="Tags (comma-separated)">
                      <Input
                        value={project.tags.join(", ")}
                        onChange={(v) => updateProject(i, "tags", v.split(",").map((t) => t.trim()).filter(Boolean))}
                      />
                    </Field>
                    <DangerButton onClick={() => removeProject(i)}>
                      <Trash2 size={12} /> Remove Project
                    </DangerButton>
                  </div>
                </Card>
              ))}

              <button type="button" onClick={addProject} className="btn-secondary w-full justify-center">
                <Plus size={14} /> Add New Project
              </button>
            </>
          )}

          {/* ── Photography ── */}
          {activeTab === "photography" && (
            <>
              <Card title="Photography Section">
                <div className="space-y-4">
                  <Field label="Section Title">
                    <Input
                      value={data.photography.title}
                      onChange={(v) => updatePhotography("title", v)}
                    />
                  </Field>
                  <Field label="Description">
                    <TextArea
                      value={data.photography.description}
                      onChange={(v) => updatePhotography("description", v)}
                    />
                  </Field>
                </div>
              </Card>

              <p className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-3 text-[11px] leading-relaxed text-[color:var(--fg-muted)]">
                <span className="font-semibold text-[color:var(--fg)]">Hosting on Vercel?</span> Production servers
                cannot write to <span className="font-mono text-[color:var(--accent)]">public/</span>. In the Vercel
                dashboard create a <strong className="text-[color:var(--fg)]">Blob</strong> store for this project so{" "}
                <span className="font-mono text-[color:var(--accent)]">BLOB_READ_WRITE_TOKEN</span> is set, then{" "}
                <strong className="text-[color:var(--fg)]">redeploy</strong>. See <span className="font-mono">.env.example</span> for
                steps. On Vercel, each upload is limited to about <strong className="text-[color:var(--fg)]">4.5MB</strong> through this
                API.
              </p>

              {data.photography.categories.map((cat, ci) => (
                <Card key={cat.slug} title={cat.title || `Category ${ci + 1}`}>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Title">
                        <Input value={cat.title} onChange={(v) => updateCategory(ci, "title", v)} />
                      </Field>
                      <Field label="Slug">
                        <Input value={cat.slug} onChange={(v) => updateCategory(ci, "slug", v)} />
                      </Field>
                      <Field label="Accent Color">
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={cat.accent}
                            onChange={(e) => updateCategory(ci, "accent", e.target.value)}
                            className="h-10 w-14 cursor-pointer rounded-lg border border-[color:var(--border)] bg-transparent p-1"
                          />
                          <input
                            className="flex-1"
                            value={cat.accent}
                            onChange={(e) => updateCategory(ci, "accent", e.target.value)}
                          />
                        </div>
                      </Field>
                    </div>
                    <Field label="Description">
                      <TextArea value={cat.description} onChange={(v) => updateCategory(ci, "description", v)} />
                    </Field>

                    {/* Image upload */}
                    <div
                      className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                        photoDropSlug === cat.slug
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10"
                          : "border-[color:var(--border)] bg-[color:var(--bg-elevated)]"
                      } ${photoUploadBusy ? "pointer-events-none opacity-60" : ""}`}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPhotoDropSlug(cat.slug);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "copy";
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        const next = e.relatedTarget as Node | null;
                        if (next && e.currentTarget.contains(next)) return;
                        setPhotoDropSlug((s) => (s === cat.slug ? null : s));
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPhotoDropSlug(null);
                        if (e.dataTransfer.files?.length) void handleImageUpload(cat.slug, ci, e.dataTransfer.files);
                      }}
                    >
                      <Upload size={24} className="mx-auto text-[color:var(--fg-muted)]" />
                      <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
                        Drop images here or{" "}
                        <label
                          htmlFor={`photo-upload-${cat.slug}`}
                          className="cursor-pointer font-medium text-[color:var(--accent)] hover:underline"
                        >
                          browse
                        </label>
                      </p>
                      <p className="mt-1 text-[11px] text-[color:var(--fg-muted)]">
                        JPEG, PNG, WebP, GIF — multiple files supported. Save when you are done.
                      </p>
                      <input
                        id={`photo-upload-${cat.slug}`}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) void handleImageUpload(cat.slug, ci, e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    {/* Image list */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)]">
                        {cat.images.length} images
                      </p>
                      {cat.images.map((img, ii) => (
                        <div
                          key={img.id}
                          className="flex gap-3 items-start rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-3"
                        >
                          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[color:var(--bg)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img key={img.src} src={img.src} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              className="w-full !py-1.5 !text-sm"
                              value={img.title}
                              onChange={(e) => {
                                const images = [...cat.images];
                                images[ii] = { ...images[ii], title: e.target.value };
                                updateCategory(ci, "images", images);
                              }}
                              placeholder="Title"
                            />
                            <input
                              className="w-full !py-1.5 !text-xs"
                              value={img.description}
                              onChange={(e) => {
                                const images = [...cat.images];
                                images[ii] = { ...images[ii], description: e.target.value };
                                updateCategory(ci, "images", images);
                              }}
                              placeholder="Description"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const images = [...cat.images];
                                images[ii] = { ...images[ii], hidden: !images[ii].hidden };
                                updateCategory(ci, "images", images);
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[color:var(--border)] text-[color:var(--fg-muted)]"
                              title={img.hidden ? "Show" : "Hide"}
                            >
                              {img.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const images = cat.images.filter((_, j) => j !== ii);
                                updateCategory(ci, "images", images);
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-[color:var(--fg-muted)]">
                        <input
                          type="checkbox"
                          checked={!!cat.hidden}
                          onChange={(e) => updateCategory(ci, "hidden", e.target.checked)}
                          className="rounded"
                        />
                        Hide this category
                      </label>
                      <DangerButton onClick={() => removeCategory(ci)}>
                        <Trash2 size={12} /> Remove Category
                      </DangerButton>
                    </div>
                  </div>
                </Card>
              ))}

              <button type="button" onClick={addCategory} className="btn-secondary w-full justify-center">
                <Plus size={14} /> Add New Category
              </button>
            </>
          )}

          {/* ── Beyond work (Life) ── */}
          {activeTab === "life" && (
            <>
              <Card title="Section header">
                <div className="space-y-4">
                  <Field label="Eyebrow">
                    <Input value={data.life.eyebrow} onChange={(v) => updateLife("eyebrow", v)} />
                  </Field>
                  <Field label="Title">
                    <Input value={data.life.title} onChange={(v) => updateLife("title", v)} />
                  </Field>
                </div>
              </Card>

              <Card title="Life snapshots">
                <div className="space-y-4">
                  {data.life.snapshots.map((snap, i) => (
                    <div
                      key={`snap-${i}`}
                      className="space-y-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[color:var(--fg-muted)]">Snapshot {i + 1}</span>
                        <DangerButton
                          onClick={() =>
                            updateLife(
                              "snapshots",
                              data.life.snapshots.filter((_, j) => j !== i)
                            )
                          }
                        >
                          <Trash2 size={12} />
                        </DangerButton>
                      </div>
                      <Input
                        value={snap.title}
                        onChange={(v) => {
                          const next = [...data.life.snapshots];
                          next[i] = { ...next[i], title: v };
                          updateLife("snapshots", next);
                        }}
                        placeholder="Title"
                      />
                      <Input
                        value={snap.note}
                        onChange={(v) => {
                          const next = [...data.life.snapshots];
                          next[i] = { ...next[i], note: v };
                          updateLife("snapshots", next);
                        }}
                        placeholder="Short note"
                      />
                      <TextArea
                        value={snap.detail}
                        onChange={(v) => {
                          const next = [...data.life.snapshots];
                          next[i] = { ...next[i], detail: v };
                          updateLife("snapshots", next);
                        }}
                        placeholder="Detail"
                        rows={3}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateLife("snapshots", [
                        ...data.life.snapshots,
                        { title: "", note: "", detail: "" } satisfies LifeSnapshot,
                      ])
                    }
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add snapshot
                  </button>
                </div>
              </Card>

              <Card title="Books">
                <p className="mb-4 text-xs text-[color:var(--fg-muted)]">
                  Optional ISBN loads a cover from Open Library when no upload is set. Palette classes are Tailwind
                  gradients for the placeholder (e.g. from-indigo-600/50 via-blue-500/30 to-cyan-600/50).
                </p>
                <div className="space-y-6">
                  {data.life.books.map((book, i) => (
                    <div
                      key={`book-${i}`}
                      className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[color:var(--fg-muted)]">Book {i + 1}</span>
                        <DangerButton
                          onClick={() =>
                            updateLife(
                              "books",
                              data.life.books.filter((_, j) => j !== i)
                            )
                          }
                        >
                          <Trash2 size={12} />
                        </DangerButton>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Title">
                          <Input
                            value={book.title}
                            onChange={(v) => {
                              const next = [...data.life.books];
                              next[i] = { ...next[i], title: v };
                              updateLife("books", next);
                            }}
                          />
                        </Field>
                        <Field label="Author">
                          <Input
                            value={book.author}
                            onChange={(v) => {
                              const next = [...data.life.books];
                              next[i] = { ...next[i], author: v };
                              updateLife("books", next);
                            }}
                          />
                        </Field>
                        <Field label="Theme label">
                          <Input
                            value={book.theme}
                            onChange={(v) => {
                              const next = [...data.life.books];
                              next[i] = { ...next[i], theme: v };
                              updateLife("books", next);
                            }}
                          />
                        </Field>
                        <Field label="ISBN (Open Library cover)">
                          <Input
                            value={book.isbn ?? ""}
                            onChange={(v) => {
                              const next = [...data.life.books];
                              next[i] = { ...next[i], isbn: v };
                              updateLife("books", next);
                            }}
                            placeholder="978..."
                          />
                        </Field>
                        <Field label="Palette (placeholder gradient)">
                          <Input
                            value={book.palette}
                            onChange={(v) => {
                              const next = [...data.life.books];
                              next[i] = { ...next[i], palette: v };
                              updateLife("books", next);
                            }}
                          />
                        </Field>
                        <Field label="Cover image path">
                          <Input
                            value={book.coverSrc ?? ""}
                            onChange={(v) => {
                              const next = [...data.life.books];
                              next[i] = { ...next[i], coverSrc: v || undefined };
                              updateLife("books", next);
                            }}
                            placeholder="/books/..."
                          />
                        </Field>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div
                          className={`flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed px-3 py-3 transition ${
                            bookDropIndex === i
                              ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10"
                              : "border-[color:var(--border)] bg-[color:var(--bg)]"
                          }`}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setBookDropIndex(i);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = "copy";
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            const next = e.relatedTarget as Node | null;
                            if (next && e.currentTarget.contains(next)) return;
                            setBookDropIndex((idx) => (idx === i ? null : idx));
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setBookDropIndex(null);
                            const f = Array.from(e.dataTransfer.files).find((file) => file.type.startsWith("image/"));
                            if (f) openBookCrop(i, f);
                            else showAssetHint("Drop an image file for the book cover.");
                          }}
                        >
                          <input
                            id={`book-cover-${i}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) openBookCrop(i, f);
                              e.target.value = "";
                            }}
                          />
                          <label
                            htmlFor={`book-cover-${i}`}
                            className="cursor-pointer text-sm font-medium text-[color:var(--accent)] hover:underline"
                          >
                            Choose cover
                          </label>
                          <span className="text-xs text-[color:var(--fg-muted)]">or drag image here (2:3 crop)</span>
                        </div>
                        <button
                          type="button"
                          className="self-start btn-secondary !py-1.5 !px-3 !text-[10px]"
                          onClick={() => {
                            const next = [...data.life.books];
                            next[i] = { ...next[i], coverSrc: undefined };
                            updateLife("books", next);
                          }}
                        >
                          Clear cover upload
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateLife("books", [
                        ...data.life.books,
                        {
                          title: "",
                          author: "",
                          theme: "",
                          palette: "from-slate-600/50 via-slate-500/30 to-zinc-600/50",
                        } satisfies LifeBook,
                      ])
                    }
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add book
                  </button>
                </div>
              </Card>

              <Card title="Places">
                <div className="space-y-4">
                  {data.life.places.map((place, i) => (
                    <div
                      key={`place-${i}`}
                      className="space-y-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[color:var(--fg-muted)]">Place {i + 1}</span>
                        <DangerButton
                          onClick={() =>
                            updateLife(
                              "places",
                              data.life.places.filter((_, j) => j !== i)
                            )
                          }
                        >
                          <Trash2 size={12} />
                        </DangerButton>
                      </div>
                      <Input
                        value={place.place}
                        onChange={(v) => {
                          const next = [...data.life.places];
                          next[i] = { ...next[i], place: v };
                          updateLife("places", next);
                        }}
                        placeholder="Place name"
                      />
                      <Input
                        value={place.context}
                        onChange={(v) => {
                          const next = [...data.life.places];
                          next[i] = { ...next[i], context: v };
                          updateLife("places", next);
                        }}
                        placeholder="Context"
                      />
                      <TextArea
                        value={place.note}
                        onChange={(v) => {
                          const next = [...data.life.places];
                          next[i] = { ...next[i], note: v };
                          updateLife("places", next);
                        }}
                        placeholder="Note"
                        rows={2}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateLife("places", [
                        ...data.life.places,
                        { place: "", context: "", note: "" } satisfies LifePlace,
                      ])
                    }
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add place
                  </button>
                </div>
              </Card>

              <Card title="Entertainment">
                <div className="space-y-4">
                  {data.life.entertainment.map((ent, i) => (
                    <div
                      key={`ent-${i}`}
                      className="space-y-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[color:var(--fg-muted)]">Block {i + 1}</span>
                        <DangerButton
                          onClick={() =>
                            updateLife(
                              "entertainment",
                              data.life.entertainment.filter((_, j) => j !== i)
                            )
                          }
                        >
                          <Trash2 size={12} />
                        </DangerButton>
                      </div>
                      <Input
                        value={ent.title}
                        onChange={(v) => {
                          const next = [...data.life.entertainment];
                          next[i] = { ...next[i], title: v };
                          updateLife("entertainment", next);
                        }}
                        placeholder="Title (e.g. Films)"
                      />
                      <Field label="Kind">
                        <select
                          className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-sm"
                          value={ent.kind}
                          onChange={(e) => {
                            const next = [...data.life.entertainment];
                            next[i] = { ...next[i], kind: e.target.value as LifeEntertainment["kind"] };
                            updateLife("entertainment", next);
                          }}
                        >
                          <option value="film">Film</option>
                          <option value="music">Music</option>
                          <option value="show">Show</option>
                        </select>
                      </Field>
                      <Field label="Picks (one per line)">
                        <TextArea
                          value={ent.picks.join("\n")}
                          onChange={(v) => {
                            const next = [...data.life.entertainment];
                            next[i] = {
                              ...next[i],
                              picks: v.split("\n").map((l) => l.trim()).filter(Boolean),
                            };
                            updateLife("entertainment", next);
                          }}
                          rows={4}
                        />
                      </Field>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateLife("entertainment", [
                        ...data.life.entertainment,
                        { title: "", kind: "film", picks: [] } satisfies LifeEntertainment,
                      ])
                    }
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add entertainment block
                  </button>
                </div>
              </Card>
            </>
          )}

          {/* ── Contact ── */}
          {activeTab === "contact" && (
            <Card title="Contact Section">
              <div className="space-y-4">
                <Field label="Section Title">
                  <Input value={data.contact.title} onChange={(v) => updateContact("title", v)} />
                </Field>
                <Field label="Description">
                  <TextArea value={data.contact.description} onChange={(v) => updateContact("description", v)} />
                </Field>
                <Field label="CTA Label">
                  <Input value={data.contact.ctaLabel} onChange={(v) => updateContact("ctaLabel", v)} />
                </Field>
                <Field label="Email">
                  <Input value={data.contact.email} onChange={(v) => updateContact("email", v)} />
                </Field>
              </div>
            </Card>
          )}
        </main>
      </div>

      <ImageCropDialog
        open={!!crop}
        imageSrc={crop?.src ?? null}
        aspect={crop?.aspect ?? 1}
        title={crop?.scope === "about" ? "Crop portrait (3:4)" : "Crop book cover (2:3)"}
        onClose={closeCrop}
        onComplete={handleCroppedFile}
        outputFileName={crop?.scope === "about" ? "portrait.jpg" : "cover.jpg"}
      />
    </div>
  );
}
