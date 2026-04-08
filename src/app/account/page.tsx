import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { AccountClient } from "@/app/account/AccountClient";

export default function AccountPage() {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <AccountClient />
    </div>
  );
}

