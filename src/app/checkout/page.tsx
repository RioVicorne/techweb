import type { Metadata } from "next";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Thanh toán",
  description: "Giỏ hàng và thanh toán — NEON KINETIC",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <CheckoutClient />
    </div>
  );
}
