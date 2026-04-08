/**
 * REST client for stitch.googleapis.com (same surface as MCP user-stitch).
 * Auth: OAuth 2 access token with Stitch scope (Authorization: Bearer …).
 */

const STITCH_API_BASE = "https://stitch.googleapis.com/v1";

export class StitchApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: string,
  ) {
    super(message);
    this.name = "StitchApiError";
  }
}

async function stitchFetch<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${STITCH_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new StitchApiError(
      `Stitch API ${res.status}: ${text.slice(0, 200)}`,
      res.status,
      text,
    );
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export async function listProjects(token: string): Promise<{
  projects?: Array<{ name?: string; title?: string }>;
}> {
  return stitchFetch(token, "/projects");
}

export async function getProject(
  token: string,
  projectResourceName: string,
): Promise<Record<string, unknown>> {
  const id = projectResourceName.replace(/^projects\//, "");
  return stitchFetch(token, `/projects/${encodeURIComponent(id)}`);
}

export async function listScreens(
  token: string,
  projectResourceName: string,
): Promise<{ screens?: Array<Record<string, unknown>> }> {
  const id = projectResourceName.replace(/^projects\//, "");
  return stitchFetch(token, `/projects/${encodeURIComponent(id)}/screens`);
}

export async function getScreen(
  token: string,
  projectId: string,
  screenId: string,
): Promise<Record<string, unknown>> {
  return stitchFetch(
    token,
    `/projects/${encodeURIComponent(projectId)}/screens/${encodeURIComponent(screenId)}`,
  );
}

export function parseProjectAndScreenIds(screenName: string | undefined): {
  projectId: string;
  screenId: string;
} | null {
  if (!screenName?.startsWith("projects/")) return null;
  const parts = screenName.split("/");
  if (parts.length < 4 || parts[2] !== "screens") return null;
  return { projectId: parts[1]!, screenId: parts[3]! };
}
