import type { StitchDesignThemeInput, StitchFontKey } from "@/lib/stitch-theme";
import type { StitchMcpDesignTheme } from "@/types/stitch-mcp";

function asFontKey(v: string | undefined): StitchFontKey | undefined {
  if (!v) return undefined;
  const allowed: StitchFontKey[] = [
    "GEIST",
    "PLUS_JAKARTA_SANS",
    "INTER",
    "MANROPE",
    "SPACE_GROTESK",
    "FONT_UNSPECIFIED",
  ];
  return allowed.includes(v as StitchFontKey) ? (v as StitchFontKey) : undefined;
}

/** Maps `get_project.designTheme` (or equivalent) to layout tokens. */
export function projectDesignThemeToInput(
  theme: StitchMcpDesignTheme | undefined | null,
): StitchDesignThemeInput {
  if (!theme) return {};
  return {
    colorMode:
      theme.colorMode === "DARK"
        ? "DARK"
        : theme.colorMode === "LIGHT"
          ? "LIGHT"
          : undefined,
    roundness: theme.roundness as StitchDesignThemeInput["roundness"],
    customColor: theme.customColor,
    namedColors: theme.namedColors,
    overridePrimaryColor: theme.overridePrimaryColor,
    overrideSecondaryColor: theme.overrideSecondaryColor,
    overrideNeutralColor: theme.overrideNeutralColor,
    headlineFont: asFontKey(theme.headlineFont),
    bodyFont: asFontKey(theme.bodyFont),
    labelFont: asFontKey(theme.labelFont),
  };
}
