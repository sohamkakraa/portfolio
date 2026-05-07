"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Camera,
  Aperture,
  Check,
  Compass,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Layout,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Save,
  Settings,
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
  EquipmentList,
  PortfolioData,
  ProjectItem,
  ProjectStorylineStep,
  ProjectMetric,
} from "@/lib/portfolio-types";
import ImageCropDialog from "@/components/admin/ImageCropDialog";
import AIChatPanel from "@/components/admin/AIChatPanel";
import { extractExif } from "@/lib/photo-meta";
import PHOTO_LOCATIONS from "@/data/photo-locations.json";

type EnrichedLoc = { city: string; country: string; countryCode?: string; lat: number; lon: number };
const PHOTO_LOC_MAP = PHOTO_LOCATIONS as Record<string, EnrichedLoc>;

// Numeric helpers — keep PhotoMeta values as their final formatted strings
// (e.g. "35mm", "f/4", "400") so the lightbox can render directly.
function formatFocal(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  if (Number.isFinite(n) && trimmed.match(/^\d+\.?\d*$/)) return `${n}mm`;
  return trimmed; // already formatted, leave it
}
function formatAperture(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  if (Number.isFinite(n) && trimmed.match(/^\d+\.?\d*$/)) return `f/${n}`;
  return trimmed.startsWith("f/") ? trimmed : trimmed;
}
function formatIso(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = parseInt(trimmed.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? String(n) : trimmed;
}
// Strip the formatting suffix so the input shows just the numeric portion.
function stripUnit(value: string | undefined, pattern: RegExp): string {
  if (!value) return "";
  return value.replace(pattern, "").trim();
}

type AdminPanelProps = {
  defaultData: PortfolioData;
  initialAuthenticated?: boolean;
};

const TABS = [
  { id: "site", label: "Site", icon: Globe },
  { id: "hero", label: "Hero", icon: Layout },
  { id: "about", label: "About", icon: User },
  { id: "projects", label: "Projects", icon: FileText },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "equipment", label: "My equipment", icon: Aperture },
  { id: "life", label: "Beyond work", icon: Compass },
  { id: "contact", label: "Contact", icon: Settings },
  { id: "ai", label: "AI Assistant", icon: Bot },
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

function NumericUnitInput({
  value,
  unit,
  unitPosition,
  step,
  placeholder,
  onChange,
}: {
  value: string;
  unit: string;
  unitPosition: "prefix" | "suffix";
  step?: string;
  placeholder?: string;
  onChange: (raw: string) => void;
}) {
  return (
    <div className="relative flex items-center">
      {unitPosition === "prefix" && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-2 text-[10px] font-mono text-[color:var(--fg-muted)] uppercase tracking-[0.15em]"
        >
          {unit}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        className={`!py-1.5 !text-xs w-full ${unitPosition === "prefix" ? "!pl-7" : "!pr-9"}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {unitPosition === "suffix" && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 text-[10px] font-mono text-[color:var(--fg-muted)] uppercase tracking-[0.15em]"
        >
          {unit}
        </span>
      )}
    </div>
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

export default function AdminPanel({ defaultData, initialAuthenticated = false }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [sessionExpiresInDays, setSessionExpiresInDays] = useState<number | null>(null);

  const [data, setData] = useState<PortfolioData>(defaultData);
  const [activeTab, setActiveTab] = useState<TabId>("site");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [assetUploadHint, setAssetUploadHint] = useState<string | null>(null);
  const [photoDropSlug, setPhotoDropSlug] = useState<string | null>(null);
  const [photoCategoryFilter, setPhotoCategoryFilter] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const [aboutDropActive, setAboutDropActive] = useState(false);
  const [bookDropIndex, setBookDropIndex] = useState<number | null>(null);
  const [photoUploadBusy, setPhotoUploadBusy] = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState<string | null>(null);
  const assetHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [crop, setCrop] = useState<{
    src: string;
    aspect: number;
    scope: "about" | "books";
    bookIndex?: number;
  } | null>(null);

  // Union of cities/countries known from globe metadata + any already-set on
  // a photo's meta. Used to populate datalists in the image metadata editor.
  const { cityOptions, countryOptions, cityToCountry, citiesByCountry } = useMemo(() => {
    const cities = new Set<string>();
    const countries = new Set<string>();
    const c2c = new Map<string, string>();
    const byCountry = new Map<string, Set<string>>();

    const note = (city?: string, country?: string) => {
      if (city) cities.add(city);
      if (country) countries.add(country);
      if (city && country) {
        if (!c2c.has(city)) c2c.set(city, country);
        if (!byCountry.has(country)) byCountry.set(country, new Set());
        byCountry.get(country)!.add(city);
      }
    };

    for (const v of Object.values(PHOTO_LOC_MAP)) note(v.city, v.country);
    for (const c of data.photography.categories) {
      for (const img of c.images) note(img.meta?.city, img.meta?.country);
    }

    return {
      cityOptions: Array.from(cities).sort(),
      countryOptions: Array.from(countries).sort(),
      cityToCountry: c2c,
      citiesByCountry: byCountry,
    };
  }, [data.photography.categories]);

  // datalist id-safe slug
  const slugifyCountry = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

  // Fetch CSRF token from the existing session cookie (runs when authenticated but token not yet in state)
  useEffect(() => {
    if (!authenticated || csrfToken) return;
    fetch("/api/auth")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (d: { valid?: boolean; csrfToken?: string; expiresInDays?: number } | null) => {
          if (d?.valid && d.csrfToken) {
            setCsrfToken(d.csrfToken);
            setSessionExpiresInDays(d.expiresInDays ?? null);
          } else if (d && !d.valid) {
            setAuthenticated(false);
          }
        }
      )
      .catch(() => {});
  }, [authenticated, csrfToken]);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        csrfToken?: string;
        expiresInDays?: number;
        error?: string;
      };
      if (res.ok && body.csrfToken) {
        setCsrfToken(body.csrfToken);
        setSessionExpiresInDays(body.expiresInDays ?? null);
        setAuthenticated(true);
        setPassword("");
        setPasswordError(false);
      } else {
        setLoginError(body.error ?? "Incorrect password.");
        setPasswordError(true);
      }
    } catch {
      setLoginError("Could not reach the server.");
      setPasswordError(true);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAuthenticated(false);
    setCsrfToken(null);
    setSessionExpiresInDays(null);
    setPassword("");
    setPasswordError(false);
    setLoginError(null);
  };

  const handleSave = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/portfolio", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
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


  const updateProjects = (field: keyof PortfolioData["projects"], value: unknown) => {
    setData((prev) => ({ ...prev, projects: { ...prev.projects, [field]: value } }));
  };

  const updatePhotography = (field: keyof PortfolioData["photography"], value: unknown) => {
    setData((prev) => ({ ...prev, photography: { ...prev.photography, [field]: value } }));
  };

  const updateContact = (field: keyof ContactSection, value: unknown) => {
    setData((prev) => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
  };

  const updateLife = (field: keyof LifeSection, value: unknown) => {
    setData((prev) => ({ ...prev, life: { ...prev.life, [field]: value } }));
  };

  const updateFooter = (field: keyof PortfolioData["footer"], value: unknown) => {
    setData((prev) => ({ ...prev, footer: { ...prev.footer, [field]: value } }));
  };

  const updateEquipment = (field: keyof EquipmentList, value: string[]) => {
    setData((prev) => ({
      ...prev,
      equipment: {
        cameras: prev.equipment?.cameras ?? [],
        lenses: prev.equipment?.lenses ?? [],
        [field]: value,
      },
    }));
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
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
      body: fd,
    });
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

  const updateStoryline = (pIdx: number, sIdx: number, field: keyof ProjectStorylineStep, value: string) => {
    setData((prev) => {
      const items = [...prev.projects.items];
      const story = [...(items[pIdx].storyline ?? [])];
      story[sIdx] = { ...story[sIdx], [field]: value } as ProjectStorylineStep;
      items[pIdx] = { ...items[pIdx], storyline: story };
      return { ...prev, projects: { ...prev.projects, items } };
    });
  };
  const addStorylineStep = (pIdx: number) => {
    setData((prev) => {
      const items = [...prev.projects.items];
      const story = [...(items[pIdx].storyline ?? [])];
      const usedLabels = new Set(story.map((s) => s.label));
      const next = (["trigger", "move", "result"] as const).find((l) => !usedLabels.has(l)) ?? "result";
      story.push({ label: next, body: "" });
      items[pIdx] = { ...items[pIdx], storyline: story };
      return { ...prev, projects: { ...prev.projects, items } };
    });
  };
  const removeStorylineStep = (pIdx: number, sIdx: number) => {
    setData((prev) => {
      const items = [...prev.projects.items];
      const story = (items[pIdx].storyline ?? []).filter((_, i) => i !== sIdx);
      items[pIdx] = { ...items[pIdx], storyline: story };
      return { ...prev, projects: { ...prev.projects, items } };
    });
  };

  const updateMetric = (pIdx: number, mIdx: number, field: keyof ProjectMetric, value: string) => {
    setData((prev) => {
      const items = [...prev.projects.items];
      const metrics = [...(items[pIdx].metrics ?? [])];
      metrics[mIdx] = { ...metrics[mIdx], [field]: value };
      items[pIdx] = { ...items[pIdx], metrics };
      return { ...prev, projects: { ...prev.projects, items } };
    });
  };
  const addMetric = (pIdx: number) => {
    setData((prev) => {
      const items = [...prev.projects.items];
      const metrics = [...(items[pIdx].metrics ?? []), { label: "", value: "" }];
      items[pIdx] = { ...items[pIdx], metrics };
      return { ...prev, projects: { ...prev.projects, items } };
    });
  };
  const removeMetric = (pIdx: number, mIdx: number) => {
    setData((prev) => {
      const items = [...prev.projects.items];
      const metrics = (items[pIdx].metrics ?? []).filter((_, i) => i !== mIdx);
      items[pIdx] = { ...items[pIdx], metrics };
      return { ...prev, projects: { ...prev.projects, items } };
    });
  };

  const updateStack = (pIdx: number, value: string[]) => {
    setData((prev) => {
      const items = [...prev.projects.items];
      items[pIdx] = { ...items[pIdx], stack: value };
      return { ...prev, projects: { ...prev.projects, items } };
    });
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
      for (let fi = 0; fi < list.length; fi++) {
        const file = list[fi]!;
        setPhotoUploadStatus(`Uploading ${fi + 1}/${list.length}: ${file.name}…`);

        // 1. Upload file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", categorySlug);
        let uploadedPath: string | null = null;
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
            body: formData,
          });
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
          uploadedPath = result.path;
        } catch {
          failures.push(`${file.name}: Network error`);
          continue;
        }

        // 2. Extract EXIF client-side
        setPhotoUploadStatus(`Reading metadata ${fi + 1}/${list.length}: ${file.name}…`);
        const exifMeta = await extractExif(file);

        // 3. AI analysis for title, description, and any missing location
        let title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        let description = "";
        let location = exifMeta.location ?? "";

        if (csrfToken) {
          try {
            setPhotoUploadStatus(`Analyzing ${fi + 1}/${list.length}: ${file.name}…`);
            const aiForm = new FormData();
            aiForm.append("file", file);
            aiForm.append("meta", JSON.stringify(exifMeta));
            aiForm.append("category", categorySlug);
            const aiRes = await fetch("/api/ai/photo-analyze", {
              method: "POST",
              headers: { "X-CSRF-Token": csrfToken },
              body: aiForm,
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json() as {
                title?: string; description?: string; location?: string; skipped?: boolean;
              };
              if (!aiData.skipped) {
                if (aiData.title) title = aiData.title;
                if (aiData.description) description = aiData.description;
                if (aiData.location) location = aiData.location;
              }
            }
          } catch {
            // AI failure is non-fatal — proceed with EXIF-only metadata
          }
        }

        additions.push({
          id: createId(),
          src: uploadedPath,
          title,
          description,
          meta: {
            ...exifMeta,
            location: location || undefined,
          },
        });
      }

      if (additions.length) {
        setData((prev) => {
          const cats = [...prev.photography.categories];
          const cat = cats[categoryIdx];
          if (!cat) return prev;
          cats[categoryIdx] = { ...cat, images: [...cat.images, ...additions] };
          return { ...prev, photography: { ...prev.photography, categories: cats } };
        });
        showAssetHint(
          `Added ${additions.length} image(s) with metadata. Click Save to persist.${failures.length ? ` (${failures.length} failed)` : ""}`
        );
      } else if (failures.length) {
        showAssetHint(`Upload failed: ${failures.slice(0, 3).join(" ")}${failures.length > 3 ? " …" : ""}`);
      }
    } finally {
      setPhotoUploadBusy(false);
      setPhotoUploadStatus(null);
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                  setLoginError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loginLoading) void handleLogin();
                }}
                placeholder="Password"
                className={`w-full pr-10 ${passwordError ? "!border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-red-400">{loginError ?? "Incorrect password."}</p>
            )}
            <button
              type="button"
              onClick={() => { void handleLogin(); }}
              disabled={loginLoading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loginLoading && <Loader2 size={14} className="animate-spin" />}
              <span>{loginLoading ? "Signing in…" : "Enter"}</span>
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
            {sessionExpiresInDays !== null && (
              <span className="hidden text-[10px] text-[color:var(--fg-subtle)] sm:inline">
                Session · {sessionExpiresInDays}d left
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
            <button
              type="button"
              onClick={() => { void handleLogout(); }}
              className="btn-secondary !py-2 !px-4 !text-[10px]"
              aria-label="Sign out"
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!csrfToken}
              className="btn-primary !py-2 !px-5 !text-[10px] disabled:opacity-60"
              title={csrfToken ? undefined : "Verifying session…"}
            >
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
        <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-1 overflow-x-auto border-t border-[color:var(--border)] bg-[color:var(--bg)] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
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
            <>
              <Card title="Editorial Hero (visible on site)">
                <div className="space-y-4">
                  <p className="text-[11px] leading-relaxed text-[color:var(--fg-muted)]">
                    Wrap any phrase in <code className="font-mono text-[color:var(--accent)]">{"{{em}}…{{/em}}"}</code> to render it italic in the accent color (used for the hero headline).
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Issue label (top-left)">
                      <Input value={data.hero.issueLabel ?? ""} onChange={(v) => updateHero("issueLabel", v)} />
                    </Field>
                    <Field label="Date label (top-right)">
                      <Input value={data.hero.dateLabel ?? ""} onChange={(v) => updateHero("dateLabel", v)} />
                    </Field>
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-2">
                    Headline (3 lines)
                  </h4>
                  {[0, 1, 2].map((i) => (
                    <Field key={i} label={`Line ${i + 1}`}>
                      <Input
                        value={data.hero.headline?.[i] ?? ""}
                        onChange={(v) => {
                          const arr = [...(data.hero.headline ?? ["", "", ""])];
                          arr[i] = v;
                          updateHero("headline", arr);
                        }}
                      />
                    </Field>
                  ))}
                  <Field label="Masthead paragraph">
                    <TextArea
                      value={data.hero.masthead ?? ""}
                      onChange={(v) => updateHero("masthead", v)}
                      rows={3}
                    />
                  </Field>
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-2">
                    In this issue (table of contents)
                  </h4>
                  {(data.hero.tableOfContents ?? []).map((entry, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[60px_1fr_60px_1fr_auto] items-center">
                      <Input
                        value={entry.num}
                        onChange={(v) => {
                          const arr = [...(data.hero.tableOfContents ?? [])];
                          arr[i] = { ...arr[i], num: v };
                          updateHero("tableOfContents", arr);
                        }}
                        placeholder="01"
                      />
                      <Input
                        value={entry.label}
                        onChange={(v) => {
                          const arr = [...(data.hero.tableOfContents ?? [])];
                          arr[i] = { ...arr[i], label: v };
                          updateHero("tableOfContents", arr);
                        }}
                        placeholder="About"
                      />
                      <Input
                        value={entry.page}
                        onChange={(v) => {
                          const arr = [...(data.hero.tableOfContents ?? [])];
                          arr[i] = { ...arr[i], page: v };
                          updateHero("tableOfContents", arr);
                        }}
                        placeholder="p.02"
                      />
                      <Input
                        value={entry.href}
                        onChange={(v) => {
                          const arr = [...(data.hero.tableOfContents ?? [])];
                          arr[i] = { ...arr[i], href: v };
                          updateHero("tableOfContents", arr);
                        }}
                        placeholder="#about"
                      />
                      <DangerButton
                        onClick={() => {
                          const arr = (data.hero.tableOfContents ?? []).filter((_, j) => j !== i);
                          updateHero("tableOfContents", arr);
                        }}
                      >
                        <X size={12} />
                      </DangerButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const arr = [...(data.hero.tableOfContents ?? []), { num: "", label: "", page: "", href: "" }];
                      updateHero("tableOfContents", arr);
                    }}
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add entry
                  </button>
                </div>
              </Card>
            </>
          )}

          {/* ── About ── */}
          {activeTab === "about" && (
            <>
              <Card title="Editorial About (visible on site)">
                <div className="space-y-4">
                  <p className="text-[11px] leading-relaxed text-[color:var(--fg-muted)]">
                    Wrap any phrase in <code className="font-mono text-[color:var(--accent)]">{"{{em}}…{{/em}}"}</code> to render it italic in the accent color.
                  </p>
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)]">
                    Headline (3 lines)
                  </h4>
                  {[0, 1, 2].map((i) => (
                    <Field key={i} label={`Line ${i + 1}`}>
                      <Input
                        value={data.about.headline?.[i] ?? ""}
                        onChange={(v) => {
                          const arr = [...(data.about.headline ?? ["", "", ""])];
                          arr[i] = v;
                          updateAbout("headline", arr);
                        }}
                      />
                    </Field>
                  ))}

                  <Field label="Body paragraph (under headline)">
                    <TextArea
                      value={data.about.body}
                      onChange={(v) => updateAbout("body", v)}
                      rows={5}
                    />
                  </Field>

                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-2">
                    Three pillars
                  </h4>
                  {(data.about.pillars ?? []).map((p, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr_auto] items-start">
                      <Input
                        value={p.title}
                        onChange={(v) => {
                          const arr = [...(data.about.pillars ?? [])];
                          arr[i] = { ...arr[i], title: v };
                          updateAbout("pillars", arr);
                        }}
                        placeholder="End-to-end"
                      />
                      <TextArea
                        value={p.body}
                        onChange={(v) => {
                          const arr = [...(data.about.pillars ?? [])];
                          arr[i] = { ...arr[i], body: v };
                          updateAbout("pillars", arr);
                        }}
                        rows={2}
                      />
                      <DangerButton
                        onClick={() => {
                          const arr = (data.about.pillars ?? []).filter((_, j) => j !== i);
                          updateAbout("pillars", arr);
                        }}
                      >
                        <X size={12} />
                      </DangerButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const arr = [...(data.about.pillars ?? []), { title: "", body: "" }];
                      updateAbout("pillars", arr);
                    }}
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add pillar
                  </button>

                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-2">
                    CV log
                  </h4>
                  {(data.about.log ?? []).map((entry, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[100px_1fr_2fr_auto] items-center">
                      <Input
                        value={entry.year}
                        onChange={(v) => {
                          const arr = [...(data.about.log ?? [])];
                          arr[i] = { ...arr[i], year: v };
                          updateAbout("log", arr);
                        }}
                        placeholder="2025–"
                      />
                      <Input
                        value={entry.org}
                        onChange={(v) => {
                          const arr = [...(data.about.log ?? [])];
                          arr[i] = { ...arr[i], org: v };
                          updateAbout("log", arr);
                        }}
                        placeholder="TU/e"
                      />
                      <Input
                        value={entry.role}
                        onChange={(v) => {
                          const arr = [...(data.about.log ?? [])];
                          arr[i] = { ...arr[i], role: v };
                          updateAbout("log", arr);
                        }}
                        placeholder="M.Sc. Data Science & AI"
                      />
                      <DangerButton
                        onClick={() => {
                          const arr = (data.about.log ?? []).filter((_, j) => j !== i);
                          updateAbout("log", arr);
                        }}
                      >
                        <X size={12} />
                      </DangerButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const arr = [...(data.about.log ?? []), { year: "", org: "", role: "" }];
                      updateAbout("log", arr);
                    }}
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add log entry
                  </button>

                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-2">
                    Portrait meta table (sidebar under photo)
                  </h4>
                  {(data.about.meta ?? []).map((row, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[180px_1fr_auto] items-center">
                      <Input
                        value={row.label}
                        onChange={(v) => {
                          const arr = [...(data.about.meta ?? [])];
                          arr[i] = { ...arr[i], label: v };
                          updateAbout("meta", arr);
                        }}
                        placeholder="Based in"
                      />
                      <Input
                        value={row.value}
                        onChange={(v) => {
                          const arr = [...(data.about.meta ?? [])];
                          arr[i] = { ...arr[i], value: v };
                          updateAbout("meta", arr);
                        }}
                        placeholder="Eindhoven, NL"
                      />
                      <DangerButton
                        onClick={() => {
                          const arr = (data.about.meta ?? []).filter((_, j) => j !== i);
                          updateAbout("meta", arr);
                        }}
                      >
                        <X size={12} />
                      </DangerButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const arr = [...(data.about.meta ?? []), { label: "", value: "" }];
                      updateAbout("meta", arr);
                    }}
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add meta row
                  </button>

                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    <Field label="Portrait label (top-left watermark)">
                      <Input
                        value={data.about.portraitLabel ?? ""}
                        onChange={(v) => updateAbout("portraitLabel", v)}
                      />
                    </Field>
                    <Field label="Portrait meta (bottom-right watermark)">
                      <Input
                        value={data.about.portraitMeta ?? ""}
                        onChange={(v) => updateAbout("portraitMeta", v)}
                      />
                    </Field>
                  </div>
                </div>
              </Card>
              <Card title="Portrait photo">
                <div className="space-y-4">
                  <Field label="Portrait photo (3:4 crop)">
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
            </>
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
                    <Field label="Stack (comma-separated)">
                      <Input
                        value={(project.stack ?? []).join(", ")}
                        onChange={(v) => updateStack(i, v.split(",").map((t) => t.trim()).filter(Boolean))}
                      />
                    </Field>

                    {/* Storyline */}
                    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--fg-muted)]">
                          Storyline (trigger / move / result)
                        </p>
                        <button
                          type="button"
                          onClick={() => addStorylineStep(i)}
                          className="text-[11px] font-medium text-[color:var(--accent)] hover:underline"
                        >
                          + Add step
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(project.storyline ?? []).map((step, sIdx) => (
                          <div key={sIdx} className="grid gap-2 sm:grid-cols-[120px_1fr_auto] items-start">
                            <select
                              value={step.label}
                              onChange={(e) => updateStoryline(i, sIdx, "label", e.target.value)}
                              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-2 py-2 text-xs"
                            >
                              <option value="trigger">trigger</option>
                              <option value="move">move</option>
                              <option value="result">result</option>
                            </select>
                            <TextArea
                              value={step.body}
                              onChange={(v) => updateStoryline(i, sIdx, "body", v)}
                            />
                            <button
                              type="button"
                              onClick={() => removeStorylineStep(i, sIdx)}
                              className="rounded-lg border border-[color:var(--border)] bg-transparent px-2 py-1 text-[11px] text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"
                              aria-label="Remove step"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        {!project.storyline?.length && (
                          <p className="text-[11px] text-[color:var(--fg-subtle)]">No storyline steps yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--fg-muted)]">
                          Metrics
                        </p>
                        <button
                          type="button"
                          onClick={() => addMetric(i)}
                          className="text-[11px] font-medium text-[color:var(--accent)] hover:underline"
                        >
                          + Add metric
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(project.metrics ?? []).map((m, mIdx) => (
                          <div key={mIdx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
                            <Input
                              value={m.label}
                              onChange={(v) => updateMetric(i, mIdx, "label", v)}
                              placeholder="label (e.g. latency)"
                            />
                            <Input
                              value={m.value}
                              onChange={(v) => updateMetric(i, mIdx, "value", v)}
                              placeholder="value (e.g. 240ms)"
                            />
                            <button
                              type="button"
                              onClick={() => removeMetric(i, mIdx)}
                              className="rounded-lg border border-[color:var(--border)] bg-transparent px-2 py-1 text-[11px] text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"
                              aria-label="Remove metric"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        {!project.metrics?.length && (
                          <p className="text-[11px] text-[color:var(--fg-subtle)]">No metrics yet.</p>
                        )}
                      </div>
                    </div>

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

              <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-3">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)]">
                  Category
                </label>
                <select
                  className="flex-1 !py-1.5 !text-sm"
                  value={photoCategoryFilter}
                  onChange={(e) => setPhotoCategoryFilter(e.target.value)}
                >
                  <option value="">All categories ({data.photography.categories.length})</option>
                  {data.photography.categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.title} · {c.images.length}
                    </option>
                  ))}
                </select>
              </div>

              {data.photography.categories
                .map((cat, ci) => ({ cat, ci }))
                .filter(({ cat }) => !photoCategoryFilter || cat.slug === photoCategoryFilter)
                .map(({ cat, ci }) => (
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
                      {photoUploadBusy && photoUploadStatus ? (
                        <>
                          <Loader2 size={24} className="mx-auto animate-spin text-[color:var(--accent)]" />
                          <p className="mt-2 text-sm text-[color:var(--accent)]">{photoUploadStatus}</p>
                        </>
                      ) : (
                        <>
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
                            JPEG, PNG, WebP — EXIF + AI metadata extracted automatically.
                          </p>
                        </>
                      )}
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
                      {cat.images.map((img, ii) => {
                        const setMeta = (field: keyof PhotoMeta, value: string) => {
                          const images = [...cat.images];
                          const existing = images[ii].meta ?? {};
                          const trimmed = value.trim();
                          const nextMeta = { ...existing, [field]: trimmed || undefined };
                          // Drop the field entirely if empty so PhotoMeta stays clean.
                          if (!trimmed) delete (nextMeta as Record<string, unknown>)[field];
                          images[ii] = { ...images[ii], meta: nextMeta };
                          updateCategory(ci, "images", images);
                        };
                        const m = img.meta ?? {};
                        return (
                          <div
                            key={img.id}
                            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-3 space-y-2"
                          >
                            <div className="flex gap-3 items-start">
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
                                  aria-label={img.hidden ? "Show image" : "Hide image"}
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
                                  aria-label="Remove image"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <details className="group">
                              <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] [&::-webkit-details-marker]:hidden">
                                <span className="inline-block group-open:hidden">▸ Metadata / EXIF</span>
                                <span className="hidden group-open:inline-block">▾ Metadata / EXIF</span>
                              </summary>
                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <input
                                  className="!py-1.5 !text-xs"
                                  list="equipment-cameras"
                                  value={m.camera ?? ""}
                                  onChange={(e) => setMeta("camera", e.target.value)}
                                  placeholder="Camera"
                                />
                                <input
                                  className="!py-1.5 !text-xs"
                                  list="equipment-lenses"
                                  value={m.lens ?? ""}
                                  onChange={(e) => setMeta("lens", e.target.value)}
                                  placeholder="Lens"
                                />
                                <NumericUnitInput
                                  value={stripUnit(m.aperture, /^f\/|f$/i)}
                                  unit="f/"
                                  unitPosition="prefix"
                                  step="0.1"
                                  placeholder="Aperture"
                                  onChange={(raw) => setMeta("aperture", formatAperture(raw) ?? "")}
                                />
                                <input
                                  className="!py-1.5 !text-xs"
                                  value={m.shutter ?? ""}
                                  onChange={(e) => setMeta("shutter", e.target.value)}
                                  placeholder="Shutter (e.g. 1/250s)"
                                />
                                <NumericUnitInput
                                  value={stripUnit(m.iso, /\D/g)}
                                  unit="iso"
                                  unitPosition="prefix"
                                  step="1"
                                  placeholder="ISO"
                                  onChange={(raw) => setMeta("iso", formatIso(raw) ?? "")}
                                />
                                <NumericUnitInput
                                  value={stripUnit(m.focalLength, /mm$/i)}
                                  unit="mm"
                                  unitPosition="suffix"
                                  step="1"
                                  placeholder="Focal length"
                                  onChange={(raw) => setMeta("focalLength", formatFocal(raw) ?? "")}
                                />
                                <input
                                  className="!py-1.5 !text-xs"
                                  type="date"
                                  value={m.date ?? ""}
                                  onChange={(e) => setMeta("date", e.target.value)}
                                  placeholder="Date"
                                />
                                <input
                                  className="!py-1.5 !text-xs"
                                  list="equipment-countries"
                                  value={m.country ?? ""}
                                  onChange={(e) => setMeta("country", e.target.value)}
                                  placeholder="Country"
                                />
                                <input
                                  className="!py-1.5 !text-xs"
                                  list={
                                    m.country
                                      ? `cities-${slugifyCountry(m.country)}`
                                      : "equipment-cities"
                                  }
                                  value={m.city ?? ""}
                                  onChange={(e) => {
                                    const newCity = e.target.value;
                                    const images = [...cat.images];
                                    const existing = images[ii].meta ?? {};
                                    const trimmed = newCity.trim();
                                    const nextMeta: Record<string, unknown> = { ...existing };
                                    if (trimmed) nextMeta.city = trimmed;
                                    else delete nextMeta.city;
                                    // Auto-set country if known and country not already set.
                                    if (trimmed && !existing.country) {
                                      const known = cityToCountry.get(trimmed);
                                      if (known) nextMeta.country = known;
                                    }
                                    images[ii] = { ...images[ii], meta: nextMeta as PhotoMeta };
                                    updateCategory(ci, "images", images);
                                  }}
                                  placeholder={m.country ? `City in ${m.country}` : "City"}
                                />
                                <input
                                  className="!py-1.5 !text-xs col-span-2"
                                  value={m.landmark ?? ""}
                                  onChange={(e) => setMeta("landmark", e.target.value)}
                                  placeholder="Landmark / point of interest (e.g. Masai Mara National Park)"
                                />
                              </div>
                            </details>
                          </div>
                        );
                      })}
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
                  <p className="text-[11px] leading-relaxed text-[color:var(--fg-muted)]">
                    Wrap any phrase in <code className="font-mono text-[color:var(--accent)]">{"{{em}}…{{/em}}"}</code> to render it italic in the accent color.
                  </p>
                  <Field label="Eyebrow (rendered as `// 04 · …`)">
                    <Input value={data.life.eyebrow} onChange={(v) => updateLife("eyebrow", v)} />
                  </Field>
                  <Field label="Title (supports {{em}}…{{/em}})">
                    <Input value={data.life.title} onChange={(v) => updateLife("title", v)} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Reading column label">
                      <Input
                        value={data.life.readingLabel ?? ""}
                        onChange={(v) => updateLife("readingLabel", v)}
                        placeholder="Reading library"
                      />
                    </Field>
                    <Field label="Places column label">
                      <Input
                        value={data.life.placesLabel ?? ""}
                        onChange={(v) => updateLife("placesLabel", v)}
                        placeholder="Places"
                      />
                    </Field>
                  </div>
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
            <>
              <Card title="Contact Section">
                <div className="space-y-4">
                  <p className="text-[11px] leading-relaxed text-[color:var(--fg-muted)]">
                    Wrap any phrase in <code className="font-mono text-[color:var(--accent)]">{"{{em}}…{{/em}}"}</code> to render it italic in the accent color.
                  </p>
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)]">
                    Headline (2 lines)
                  </h4>
                  {[0, 1].map((i) => (
                    <Field key={i} label={`Line ${i + 1}`}>
                      <Input
                        value={data.contact.headline?.[i] ?? ""}
                        onChange={(v) => {
                          const arr = [...(data.contact.headline ?? ["", ""])];
                          arr[i] = v;
                          updateContact("headline", arr);
                        }}
                      />
                    </Field>
                  ))}
                  <Field label="Section title (legacy / used by AI doc only)">
                    <Input value={data.contact.title} onChange={(v) => updateContact("title", v)} />
                  </Field>
                  <Field label="Description (paragraph beside CTA)">
                    <TextArea value={data.contact.description} onChange={(v) => updateContact("description", v)} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="CTA Label">
                      <Input value={data.contact.ctaLabel} onChange={(v) => updateContact("ctaLabel", v)} />
                    </Field>
                    <Field label="Email">
                      <Input value={data.contact.email} onChange={(v) => updateContact("email", v)} />
                    </Field>
                  </div>
                </div>
              </Card>
              <Card title="Footer">
                <div className="space-y-4">
                  <Field label="Footer note (left-aligned)">
                    <Input value={data.footer.note} onChange={(v) => updateFooter("note", v)} />
                  </Field>
                  <Field label="Version note (right-aligned, optional)">
                    <Input
                      value={data.footer.versionNote ?? ""}
                      onChange={(v) => updateFooter("versionNote", v)}
                      placeholder="v3.0 · last edit: today"
                    />
                  </Field>
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] pt-2">
                    Footer links (joined with site socials in the footer rail)
                  </h4>
                  {(data.footer.links ?? []).map((l, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={l.label}
                        onChange={(v) => {
                          const arr = [...(data.footer.links ?? [])];
                          arr[i] = { ...arr[i], label: v };
                          updateFooter("links", arr);
                        }}
                        placeholder="Admin"
                      />
                      <Input
                        value={l.href}
                        onChange={(v) => {
                          const arr = [...(data.footer.links ?? [])];
                          arr[i] = { ...arr[i], href: v };
                          updateFooter("links", arr);
                        }}
                        placeholder="/admin"
                      />
                      <DangerButton
                        onClick={() => updateFooter("links", (data.footer.links ?? []).filter((_, j) => j !== i))}
                      >
                        <X size={12} />
                      </DangerButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateFooter("links", [...(data.footer.links ?? []), { label: "", href: "" }])}
                    className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                  >
                    <Plus size={12} /> Add footer link
                  </button>
                </div>
              </Card>
            </>
          )}

          {activeTab === "equipment" && (
            <Card title="My equipment (autofill source)">
              <div className="space-y-6">
                <p className="text-[11px] leading-relaxed text-[color:var(--fg-muted)]">
                  Items listed here suggest as you type into the camera / lens
                  fields on each photo. Add the gear you actually use so the
                  Photography tab fills out faster.
                </p>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] mb-2">
                    Cameras
                  </h4>
                  <div className="space-y-2">
                    {(data.equipment?.cameras ?? []).map((c, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          value={c}
                          onChange={(v) => {
                            const arr = [...(data.equipment?.cameras ?? [])];
                            arr[i] = v;
                            updateEquipment("cameras", arr);
                          }}
                          placeholder="Sony A7 IV"
                        />
                        <DangerButton
                          onClick={() => {
                            const arr = (data.equipment?.cameras ?? []).filter((_, j) => j !== i);
                            updateEquipment("cameras", arr);
                          }}
                        >
                          <X size={12} />
                        </DangerButton>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateEquipment("cameras", [...(data.equipment?.cameras ?? []), ""])}
                      className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                    >
                      <Plus size={12} /> Add camera
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--fg-muted)] mb-2">
                    Lenses
                  </h4>
                  <div className="space-y-2">
                    {(data.equipment?.lenses ?? []).map((l, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          value={l}
                          onChange={(v) => {
                            const arr = [...(data.equipment?.lenses ?? [])];
                            arr[i] = v;
                            updateEquipment("lenses", arr);
                          }}
                          placeholder="Sony FE 24-70mm f/2.8 GM"
                        />
                        <DangerButton
                          onClick={() => {
                            const arr = (data.equipment?.lenses ?? []).filter((_, j) => j !== i);
                            updateEquipment("lenses", arr);
                          }}
                        >
                          <X size={12} />
                        </DangerButton>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateEquipment("lenses", [...(data.equipment?.lenses ?? []), ""])}
                      className="btn-secondary !py-1.5 !px-3 !text-[10px]"
                    >
                      <Plus size={12} /> Add lens
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "ai" && (
            <AIChatPanel
              data={data}
              csrfToken={csrfToken ?? ""}
              onDataChange={(next) => setData(next)}
            />
          )}
        </main>
      </div>

      {/* Datalists for autofill — render post-mount to avoid SSR/client divergence */}
      {mounted && (
        <>
          <datalist id="equipment-cameras">
            {(data.equipment?.cameras ?? []).filter(Boolean).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="equipment-lenses">
            {(data.equipment?.lenses ?? []).filter(Boolean).map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <datalist id="equipment-cities">
            {cityOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="equipment-countries">
            {countryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {Array.from(citiesByCountry.entries()).map(([country, cities]) => (
            <datalist key={country} id={`cities-${slugifyCountry(country)}`}>
              {Array.from(cities)
                .sort()
                .map((c) => (
                  <option key={c} value={c} />
                ))}
            </datalist>
          ))}
        </>
      )}

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
