import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { HomeDesktop } from "@/components/features/home/desktop/HomeDesktop";
import { HomeFooter } from "@/components/features/home/shared/HomeFooter";
import { HomeMobile } from "@/components/features/home/mobile/HomeMobile";
import { getCatalogProducts } from "@/lib/catalog";

export default async function Home() {
  const products = await getCatalogProducts();
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <HomeMobile products={products} />
      <HomeDesktop products={products} />
      <HomeFooter />
    </div>
  );
}
