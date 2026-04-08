import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { PaymentMethodClient } from "./PaymentMethodClient";

export const metadata: Metadata = {
  title: "Phương thức thanh toán",
  description: "Chọn phương thức thanh toán — RioShop",
};

export default function PaymentMethodPage() {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <Suspense>
        <PaymentMethodClient />
      </Suspense>
    </div>
  );
}

