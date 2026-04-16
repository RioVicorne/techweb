import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentMethodClient } from "./PaymentMethodClient";

export const metadata: Metadata = {
  title: "Phương thức thanh toán",
  description: "Chọn phương thức thanh toán — RioShop",
};

export default function PaymentMethodPage() {
  return (
    <div className="min-h-screen">
      <Suspense>
        <PaymentMethodClient />
      </Suspense>
    </div>
  );
}

