// Deliverable file rules, shared by the upload route, the Server Action and the upload panel.

const MB = 1024 * 1024;

/** PDF, images and zip. Windows browsers label zip files application/x-zip-compressed. */
export const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/zip",
  "application/x-zip-compressed",
];

/** Shown when a file would take the workspace past its plan's storage. */
export const STORAGE_FULL = "Your plan's file storage is full. Upgrade for more space, or remove old files.";

/** For the file picker. */
export const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.zip," + ALLOWED_TYPES.join(",");

/**
 * Largest upload allowed: 50 MB, or 10 MB in the public demo workspace.
 * Server only (reads DEMO_ORG_ID); pass the number to client components.
 */
export function uploadLimitBytes(orgId: string): number {
  return orgId === process.env.DEMO_ORG_ID ? 10 * MB : 50 * MB;
}

/** "10 MB" */
export function limitLabel(bytes: number): string {
  return `${Math.round(bytes / MB)} MB`;
}

/** Every upload lives under its workspace and project, so a demo reset can delete visitors' files. */
export function uploadPrefix(orgId: string, projectId: string): string {
  return `orgs/${orgId}/projects/${projectId}/`;
}

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

/** True for a file stored in our Vercel Blob store (as opposed to a /demo-files sample). */
export function isBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && BLOB_HOST.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * The link that downloads a file instead of opening it. Blob files are on another domain, where
 * the browser ignores the download attribute, so Blob's ?download=1 sets the download header.
 * Sample files in /demo-files are same-origin and use the download attribute.
 */
export function downloadHref(fileUrl: string): string {
  return isBlobUrl(fileUrl) ? `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}download=1` : fileUrl;
}

/** "menu-page-design.pdf" → "Menu page design" */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return base ? base[0].toUpperCase() + base.slice(1) : "";
}
