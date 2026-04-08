import { notFound } from "next/navigation";
import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { getProductById } from "@/data/products";
import { ProductPageView } from "@/components/features/product/ProductPageView";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return notFound();

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <ProductPageView product={product} />
    </div>
  );
}

