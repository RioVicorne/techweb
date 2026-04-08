import { notFound } from "next/navigation";
import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { ProductPageView } from "@/components/features/product/ProductPageView";
import { getCatalogProductBySlug } from "@/lib/catalog";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getCatalogProductBySlug(id);
  if (!product) return notFound();

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <ProductPageView product={product} />
    </div>
  );
}

