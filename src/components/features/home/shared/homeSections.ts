import type { CatalogProduct } from "@/lib/catalog";

/** Số sản phẩm hiển thị trong “Deal hot” — phần còn lại vào “New Drops” (mobile + desktop). */
export const HOME_HOT_COUNT = 2;

export function splitHomeProductSections(products: CatalogProduct[]) {
  return {
    hotProducts: products.slice(0, HOME_HOT_COUNT),
    newProducts: products.slice(HOME_HOT_COUNT),
  };
}

export function imageObjectFitForProductTitle(title: string): "object-contain" | "object-cover" {
  return title.toLowerCase().includes("mouse") ? "object-contain" : "object-cover";
}
