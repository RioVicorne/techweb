/** Catalog — stable `id` for cart / checkout */

export type Product = (typeof PRODUCTS)[number];

export const PRODUCTS = [
  {
    id: "apex-pro-optical-mouse",
    title: "Apex Pro Optical Mouse",
    price: "1.450.000",
    reviews: "(124)",
    stars: 4,
    badge: "-15%" as const,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-ZAIKkqozHqR5NXdwIY5wERkCCU8XemE5dlS5TDW1PhnH7T_vLzSUgS5zngG_LKWrOEKa4DW_Ay2Z0wQdi3SYD48wdAmTLkM_MSYN1hHdprkRCyphb0xDb-MhtvmTnPrRj8WzOskZd6vxHLd4mv05ak9CWHMZLGNJHm857WsO1hPEVVsmSn_OtfGzVjzMfbQ7ylSMrRz19Kt-mgqZGvjC8__Gh3x-hm2W0wiMFG96VNl3sVEgKwRIUh3e84RMzScledhdur9J2eX3",
  },
  {
    id: "steam-wallet-gift-card",
    title: "Steam Wallet Gift Card",
    price: "500.000",
    reviews: "(2.1k)",
    stars: 5,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIcXd3ZRQatYjuPwytNiY7kEnhk7o8A7r3J6hu-R0XgcWv-J4OOU85VPxV1iU0xjfq_A_CjeCm-kNNXZood-8TIAoBL-Gc8mRHhwQTrx3TFRxRuSCdJuGcHkmsYrwj31NpEBt04WTsgdhvaVfZjYlMcpZ1LVJta7__wq1lXDC8gO-F_6U3EmmOiBKOthilzFBjb6bUBW1d8JmRwCN5cQxXVm6JbsYshBBGHwc8WtEOCCwk2gNxeCPNVHeoWFVQDtwHhrIu1YrTr59s",
  },
  {
    id: "sonic-blast-v2-headset",
    title: "Sonic Blast V2 Headset",
    price: "3.200.000",
    reviews: "(89)",
    stars: 4,
    tag: "New" as const,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNY0lCRI-F727JTPiENcpvqCluvZZyQlS4lCH9JqLxL0PP6sDzwJO8aPxl_c-PWgqrQRYoHFLyilop4Yq4oL3Z5hOMIz2k3jPnrH27zvtl9aPUwXBTLEt-YEHe6zQfhzd6V_MryBAmZnidgVsnFpr_rvmUYkRnfwxa6Icx_a7JB9LAtte-FhBrH2gn3hQcbKDaT_v4d_WtdZRr3rl5LMCldmlevf2avgdVxNUZPzuvfxuFHON4DiEf5yYA2QHGbk0MvEF7Z_uhH7kZ",
  },
  {
    id: "elite-fusion-controller",
    title: "Elite Fusion Controller",
    price: "2.750.000",
    reviews: "(45)",
    stars: 3,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKDa2jFlKA71R3sfrWNruXUhLDkBq-tRlhFqtO-T4klFh3oM8h9aTI4WgLe3sVzEMEQ9t31-OTFn37BDJDxyR68yPydvBq-D-cUHjNWBceDBJxKWf7wLGTHjZBH9o2FD_nhlpaEcr5cWZLgjS--o0deaiEN0RbbbjBvbNXiT0gARVpa2woe2RZrLiimcLU5XtOkfQmuXptQjYRPq3KG6nNns0fkNkhLOv-UpLpiyC6hkOwRCOc6bb0UWI7rRKD1W39Z3uSeWWUQFcR",
  },
] as const;

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

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
