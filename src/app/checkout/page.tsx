import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Thanh toán",
  description: "Giỏ hàng và thanh toán — RioShop",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
      <Suspense>
        <CheckoutClient />
      </Suspense>
    </div>
  );
}
