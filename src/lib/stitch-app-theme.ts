import type { CSSProperties } from "react";
import { loadStitchData } from "@/lib/load-stitch-data";
import { projectDesignThemeToInput } from "@/lib/stitch-from-mcp";
import { stitchThemeToStyle } from "@/lib/stitch-theme";

/** Theme cho `<body>` — từ `stitch-mcp-export.json` hoặc API khi có token. */
export async function getAppStitchThemeStyle(): Promise<CSSProperties> {
  const { data } = await loadStitchData();
  return stitchThemeToStyle(projectDesignThemeToInput(data.project?.designTheme));
}

export async function getStitchProjectTitle(): Promise<string | undefined> {
  const { data } = await loadStitchData();
  return data.project?.title;
}

export async function isStitchDarkMode(): Promise<boolean> {
  const { data } = await loadStitchData();
  return data.project?.designTheme?.colorMode === "DARK";
}
