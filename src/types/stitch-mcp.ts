/**
 * Subset of Stitch MCP payloads (get_project, get_screen, list_screens)
 * aligned with user-stitch tool output schemas.
 */

export interface StitchMcpHtmlFile {
  mimeType?: string;
  downloadUrl?: string;
  fileContentBase64?: string;
  name?: string;
}

export interface StitchMcpDesignTheme {
  colorMode?: string;
  roundness?: string;
  customColor?: string;
  namedColors?: Record<string, string>;
  overridePrimaryColor?: string;
  overrideSecondaryColor?: string;
  overrideNeutralColor?: string;
  headlineFont?: string;
  bodyFont?: string;
  labelFont?: string;
}

export interface StitchMcpProject {
  name?: string;
  title?: string;
  designTheme?: StitchMcpDesignTheme;
  deviceType?: string;
}

export interface StitchMcpScreen {
  name?: string;
  title?: string;
  deviceType?: string;
  width?: string;
  height?: string;
  htmlCode?: StitchMcpHtmlFile | null;
}

/**
 * Shape for `src/data/stitch-mcp-export.json` — chỉ cần `project` (+ designTheme) để áp theme;
 * màn hình / htmlCode lấy trực tiếp qua MCP khi cần.
 */
export interface StitchMcpExport {
  project: StitchMcpProject;
  /** Khi gọi API Stitch (token) — không bắt buộc trong file JSON cục bộ. */
  primaryScreen?: StitchMcpScreen | null;
}
