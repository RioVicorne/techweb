import type { CSSProperties } from "react";

/**
 * Maps Stitch `get_project` / `designTheme` (MCP user-stitch) to CSS custom properties.
 * Aligns with DesignTheme fields from list_projects output schema.
 */

export type StitchColorMode = "LIGHT" | "DARK" | "COLOR_MODE_UNSPECIFIED";

export type StitchRoundness =
  | "ROUND_FOUR"
  | "ROUND_EIGHT"
  | "ROUND_TWELVE"
  | "ROUND_FULL"
  | "ROUND_TWO"
  | "ROUNDNESS_UNSPECIFIED";

export type StitchFontKey =
  | "GEIST"
  | "PLUS_JAKARTA_SANS"
  | "INTER"
  | "MANROPE"
  | "SPACE_GROTESK"
  | "FONT_UNSPECIFIED";

export interface StitchDesignThemeInput {
  colorMode?: StitchColorMode;
  roundness?: StitchRoundness;
  customColor?: string;
  namedColors?: Record<string, string>;
  overridePrimaryColor?: string;
  overrideSecondaryColor?: string;
  overrideNeutralColor?: string;
  headlineFont?: StitchFontKey;
  bodyFont?: StitchFontKey;
  labelFont?: StitchFontKey;
}

const roundnessToRadius: Record<StitchRoundness, string> = {
  ROUNDNESS_UNSPECIFIED: "0.75rem",
  ROUND_TWO: "2px",
  ROUND_FOUR: "4px",
  ROUND_EIGHT: "8px",
  ROUND_TWELVE: "12px",
  ROUND_FULL: "9999px",
};

const fontStack: Record<StitchFontKey, string> = {
  FONT_UNSPECIFIED:
    "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  GEIST: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  INTER: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  MANROPE:
    'var(--font-manrope), "Manrope", ui-sans-serif, system-ui, sans-serif',
  PLUS_JAKARTA_SANS:
    "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif",
  SPACE_GROTESK:
    'var(--font-space-grotesk), "Space Grotesk", ui-sans-serif, system-ui, sans-serif',
};

export const defaultStitchTheme: Required<
  Pick<
    StitchDesignThemeInput,
    "colorMode" | "roundness" | "namedColors"
  >
> & StitchDesignThemeInput = {
  colorMode: "LIGHT",
  roundness: "ROUND_TWELVE",
  customColor: "#14b8c8",
  namedColors: {
    background: "#f8fcfd",
    onBackground: "#05232b",
    primary: "#0ea5b9",
    onPrimary: "#ffffff",
    primaryContainer: "#d7f6fb",
    onPrimaryContainer: "#0b4e5a",
    primaryDim: "#0891a6",
    secondary: "#06b6d4",
    onSecondary: "#ffffff",
    secondaryContainer: "#ccf5fb",
    onSecondaryContainer: "#0a4a57",
    surface: "#ffffff",
    surfaceBright: "#ffffff",
    surfaceContainer: "#f3fbfd",
    surfaceContainerLow: "#f7fdff",
    surfaceContainerHigh: "#edf8fb",
    surfaceContainerHighest: "#e4f3f8",
    surfaceContainerLowest: "#ffffff",
    outline: "#b8dce5",
    outlineVariant: "#d4eaf0",
    onSurface: "#0f2a33",
    onSurfaceVariant: "#4f6b74",
    error: "#dc2626",
    errorContainer: "#fee2e2",
    onError: "#ffffff",
    onErrorContainer: "#7f1d1d",
    warning: "#d97706",
    onWarning: "#ffffff",
    success: "#059669",
    onSuccess: "#ffffff",
  },
  headlineFont: "GEIST",
  bodyFont: "GEIST",
  labelFont: "GEIST",
};

export const darkStitchNamedColors: Record<string, string> = {
  background: "#f2fbfd",
  onBackground: "#041d24",
  primary: "#0891a6",
  onPrimary: "#ffffff",
  primaryContainer: "#c8eff7",
  onPrimaryContainer: "#083d47",
  primaryDim: "#0e7490",
  secondary: "#06b6d4",
  onSecondary: "#ffffff",
  secondaryContainer: "#d2f3f8",
  onSecondaryContainer: "#0a4a57",
  surface: "#f7fcfe",
  surfaceBright: "#ffffff",
  surfaceContainer: "#eef9fc",
  surfaceContainerLow: "#f4fbfd",
  surfaceContainerHigh: "#e8f5f9",
  surfaceContainerHighest: "#deedf3",
  surfaceContainerLowest: "#ffffff",
  outline: "#b6d6de",
  outlineVariant: "#cfe5eb",
  onSurface: "#102830",
  onSurfaceVariant: "#4d6972",
  error: "#dc2626",
  errorContainer: "#fee2e2",
  onError: "#ffffff",
  onErrorContainer: "#7f1d1d",
  warning: "#d97706",
  onWarning: "#ffffff",
  success: "#059669",
  onSuccess: "#ffffff",
};

/** Stitch API often returns snake_case keys; map to camelCase for token lookup. */
export function normalizeStitchNamedColors(
  raw?: Record<string, string> | null,
): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

function pick(
  colors: Record<string, string | undefined>,
  camel: string,
): string | undefined {
  const v = colors[camel];
  return typeof v === "string" ? v : undefined;
}

export function stitchThemeToStyle(
  theme: StitchDesignThemeInput = {},
): CSSProperties {
  const merged = { ...defaultStitchTheme, ...theme };
  const isDark = merged.colorMode === "DARK";
  const normalized = normalizeStitchNamedColors(merged.namedColors ?? undefined);
  const colors: Record<string, string | undefined> = {
    ...(isDark ? darkStitchNamedColors : defaultStitchTheme.namedColors),
    ...normalized,
  };
  if (merged.overridePrimaryColor) colors.primary = merged.overridePrimaryColor;
  if (merged.overrideSecondaryColor)
    colors.secondary = merged.overrideSecondaryColor;
  if (merged.overrideNeutralColor && !normalized.surface)
    colors.surface = merged.overrideNeutralColor;

  const seed = merged.customColor ?? colors.primary ?? "#2563eb";

  const style: CSSProperties & Record<string, string | undefined> = {
    ["--stitch-radius-sm" as string]: roundnessToRadius["ROUND_FOUR"],
    ["--stitch-radius-md" as string]:
      roundnessToRadius[merged.roundness ?? "ROUND_TWELVE"],
    ["--stitch-radius-lg" as string]:
      roundnessToRadius[merged.roundness ?? "ROUND_TWELVE"],
    ["--stitch-font-headline" as string]:
      fontStack[merged.headlineFont ?? "GEIST"],
    ["--stitch-font-body" as string]: fontStack[merged.bodyFont ?? "GEIST"],
    ["--stitch-font-label" as string]: fontStack[merged.labelFont ?? "GEIST"],
    ["--stitch-color-primary" as string]: pick(colors, "primary") ?? seed,
    ["--stitch-color-on-primary" as string]:
      pick(colors, "onPrimary") ?? "#fff",
    ["--stitch-color-secondary" as string]:
      pick(colors, "secondary") ?? "#06b6d4",
    ["--stitch-color-on-secondary" as string]:
      pick(colors, "onSecondary") ?? "#ffffff",
    ["--stitch-color-surface" as string]:
      pick(colors, "surface") ?? "#ffffff",
    ["--stitch-color-surface-container" as string]:
      pick(colors, "surfaceContainer") ?? "#f3fbfd",
    ["--stitch-color-surface-container-low" as string]:
      pick(colors, "surfaceContainerLow") ?? "#f7fdff",
    ["--stitch-color-surface-container-lowest" as string]:
      pick(colors, "surfaceContainerLowest") ?? "#ffffff",
    ["--stitch-color-surface-container-high" as string]:
      pick(colors, "surfaceContainerHigh") ?? "#edf8fb",
    ["--stitch-color-surface-container-highest" as string]:
      pick(colors, "surfaceContainerHighest") ?? "#e4f3f8",
    ["--stitch-color-outline" as string]:
      pick(colors, "outline") ?? "#b8dce5",
    ["--stitch-color-outline-variant" as string]:
      pick(colors, "outlineVariant") ?? "#d4eaf0",
    ["--stitch-color-on-surface" as string]:
      pick(colors, "onSurface") ?? "#0f2a33",
    ["--stitch-color-on-surface-variant" as string]:
      pick(colors, "onSurfaceVariant") ?? "#4f6b74",
    ["--stitch-color-background" as string]:
      pick(colors, "background") ?? "#f8fcfd",
    ["--stitch-color-on-background" as string]:
      pick(colors, "onBackground") ?? "#05232b",
    ["--stitch-color-primary-container" as string]:
      pick(colors, "primaryContainer") ?? "#d7f6fb",
    ["--stitch-color-on-primary-container" as string]:
      pick(colors, "onPrimaryContainer") ?? "#0b4e5a",
    ["--stitch-color-secondary-container" as string]:
      pick(colors, "secondaryContainer") ?? "#ccf5fb",
    ["--stitch-color-on-secondary-container" as string]:
      pick(colors, "onSecondaryContainer") ?? "#0a4a57",
    ["--stitch-color-error" as string]: pick(colors, "error") ?? "#dc2626",
    ["--stitch-color-error-container" as string]:
      pick(colors, "errorContainer") ?? "#fee2e2",
    ["--stitch-color-on-error" as string]:
      pick(colors, "onError") ?? "#ffffff",
    ["--stitch-color-on-error-container" as string]:
      pick(colors, "onErrorContainer") ?? "#7f1d1d",
    ["--stitch-color-warning" as string]:
      pick(colors, "warning") ?? "#d97706",
    ["--stitch-color-on-warning" as string]:
      pick(colors, "onWarning") ?? "#ffffff",
    ["--stitch-color-success" as string]:
      pick(colors, "success") ?? "#059669",
    ["--stitch-color-on-success" as string]:
      pick(colors, "onSuccess") ?? "#ffffff",
    ["--stitch-seed" as string]: seed,
  };

  const tertiary = pick(colors, "tertiary");
  if (tertiary) style["--stitch-color-tertiary" as string] = tertiary;
  const outlineVariant = pick(colors, "outlineVariant");
  if (outlineVariant)
    style["--stitch-color-outline-variant" as string] = outlineVariant;
  const surfaceBright = pick(colors, "surfaceBright");
  if (surfaceBright)
    style["--stitch-color-surface-bright" as string] = surfaceBright;
  const surfaceContainerLow = pick(colors, "surfaceContainerLow");
  if (surfaceContainerLow)
    style["--stitch-color-surface-container-low" as string] =
      surfaceContainerLow;
  const surfaceContainerHigh = pick(colors, "surfaceContainerHigh");
  if (surfaceContainerHigh)
    style["--stitch-color-surface-container-high" as string] =
      surfaceContainerHigh;
  const secondaryContainer = pick(colors, "secondaryContainer");
  if (secondaryContainer)
    style["--stitch-color-secondary-container" as string] = secondaryContainer;
  const onSecondaryContainer = pick(colors, "onSecondaryContainer");
  if (onSecondaryContainer)
    style["--stitch-color-on-secondary-container" as string] =
      onSecondaryContainer;
  const primaryDim = pick(colors, "primaryDim");
  if (primaryDim)
    style["--stitch-color-primary-dim" as string] = primaryDim;
  const background = pick(colors, "background");
  if (background)
    style["--stitch-color-background" as string] = background;

  const pageBg = background ?? pick(colors, "surface");
  if (pageBg) style.background = pageBg;

  const surfaceContainerHighest = pick(colors, "surfaceContainerHighest");
  if (surfaceContainerHighest)
    style["--stitch-color-surface-container-highest" as string] =
      surfaceContainerHighest;
  const primaryContainer = pick(colors, "primaryContainer");
  if (primaryContainer)
    style["--stitch-color-primary-container" as string] = primaryContainer;

  return style;
}
