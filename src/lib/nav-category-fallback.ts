/** Danh mục tĩnh dùng khi API chưa sẵn sàng — giữ đồng bộ desktop header + mobile bottom nav. */

export type NavCategoryItem = { slug: string; name: string };

/** Tối đa số danh mục hiển thị trong menu (header dropdown + mobile sheet). */
export const NAV_CATEGORY_MENU_MAX = 8;


export function iconForCategorySlug(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("mouse")) return "mouse";
  if (s.includes("audio") || s.includes("head")) return "headphones";
  if (s.includes("stream")) return "videocam";
  if (s.includes("periph") || s.includes("keyboard")) return "keyboard";
  if (s.includes("hardware") || s.includes("storage")) return "storage";
  if (s.includes("memory")) return "memory";
  if (s.includes("controller") || s.includes("tay")) return "sports_esports";
  if (s.includes("gift") || s.includes("card") || s.includes("nap")) return "redeem";
  return "grid_view";
}

/** Accent for home category chips — derived from slug so UI stays aligned with nav/category page. */
export type CategoryChipAccent = "neutral" | "primary" | "secondary";

export function accentForCategorySlug(slug: string): CategoryChipAccent {
  const s = slug.toLowerCase();
  if (s.includes("mouse")) return "primary";
  if (s.includes("audio") || s.includes("head")) return "secondary";
  return "neutral";
}
