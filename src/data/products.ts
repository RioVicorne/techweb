/** Product shape used across UI/cart (id is the slug). */
export type Product = {
  id: string;
  title: string;
  price: string; // display format e.g. 1.450.000
  reviews: string;
  stars: number;
  img: string;
  badge?: string;
  tag?: string;
};

export function parseDisplayPriceToVnd(display: string): number {
  const n = parseInt(display.replace(/\./g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Định dạng VND kiểu 1.450.000 */
export function formatVndDisplay(amount: number): string {
  return Math.max(0, Math.floor(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
