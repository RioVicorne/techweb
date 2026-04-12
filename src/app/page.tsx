import { HomeDesktop } from "@/components/features/home/desktop/HomeDesktop";
import { HomeFooter } from "@/components/features/home/shared/HomeFooter";
import { HomeMobile } from "@/components/features/home/mobile/HomeMobile";
import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { splitHomeProductSections } from "@/components/features/home/shared/homeSections";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";
import { NAV_CATEGORY_MENU_MAX, STATIC_NAV_CATEGORIES } from "@/lib/nav-category-fallback";

export default async function Home() {
  const [products, categoriesRaw] = await Promise.all([getCatalogProducts(), getCatalogCategories()]);
  const homeCategories =
    categoriesRaw.length > 0
      ? categoriesRaw.slice(0, NAV_CATEGORY_MENU_MAX).map((c) => ({ slug: c.slug, name: c.name }))
      : STATIC_NAV_CATEGORIES;
  const { hotProducts, newProducts } = splitHomeProductSections(products);

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <HomeMobile categories={homeCategories} hotProducts={hotProducts} newProducts={newProducts} />
      <HomeDesktop categories={homeCategories} hotProducts={hotProducts} newProducts={newProducts} />
      <HomeFooter />
    </div>
  );
}
