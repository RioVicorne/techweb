import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { HomeDesktop } from "@/components/features/home/desktop/HomeDesktop";
import { HomeFooter } from "@/components/features/home/shared/HomeFooter";
import { HomeMobile } from "@/components/features/home/mobile/HomeMobile";

export default function Home() {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <HomeMobile />
      <HomeDesktop />
      <HomeFooter />
    </div>
  );
}
