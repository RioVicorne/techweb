import stitchExport from "@/data/stitch-mcp-export.json";
import {
  getProject,
  getScreen,
  listProjects,
  listScreens,
  parseProjectAndScreenIds,
} from "@/lib/stitch-google-api";
import type { StitchMcpExport, StitchMcpScreen } from "@/types/stitch-mcp";

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

/**
 * Ưu tiên API khi có STITCH_ACCESS_TOKEN; ngược lại dùng `stitch-mcp-export.json`.
 */
export async function loadStitchData(): Promise<{
  data: StitchMcpExport;
  source: "api" | "file";
  error?: string;
}> {
  const fallback = stitchExport as StitchMcpExport;
  const token = env("STITCH_ACCESS_TOKEN") ?? env("GOOGLE_ACCESS_TOKEN");

  if (!token) {
    return { data: fallback, source: "file" };
  }

  try {
    const { projects = [] } = await listProjects(token);
    let projectName = projects[0]?.name;

    const forcedProject = env("STITCH_PROJECT_ID");
    if (forcedProject) {
      projectName = forcedProject.includes("/")
        ? forcedProject
        : `projects/${forcedProject}`;
    }

    if (!projectName) {
      return {
        data: fallback,
        source: "file",
        error: "Không có project nào từ ListProjects.",
      };
    }

    const project = (await getProject(token, projectName)) as {
      name?: string;
      title?: string;
      designTheme?: StitchMcpExport["project"]["designTheme"];
    };

    const { screens = [] } = await listScreens(token, projectName);

    let chosen: Record<string, unknown> | undefined = screens[0];
    const forcedScreen = env("STITCH_SCREEN_ID");
    if (forcedScreen && screens.length) {
      chosen =
        screens.find((s) => {
          const n = String(s.name ?? "");
          return (
            n.endsWith(`/screens/${forcedScreen}`) || n.includes(forcedScreen)
          );
        }) ?? chosen;
    }

    let fullScreen: Record<string, unknown> | undefined = chosen;
    const ids = parseProjectAndScreenIds(String(chosen?.name ?? ""));
    if (ids) {
      fullScreen = await getScreen(token, ids.projectId, ids.screenId);
    }

    const primaryScreen = fullScreen as StitchMcpScreen | undefined;

    return {
      source: "api",
      data: {
        project: {
          name: project.name,
          title: project.title,
          designTheme: project.designTheme,
        },
        primaryScreen: primaryScreen ?? null,
      },
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : typeof e === "string" ? e : "Lỗi không xác định";
    return {
      data: fallback,
      source: "file",
      error: message,
    };
  }
}
