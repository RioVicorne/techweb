import { notFound } from "next/navigation";
import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { ProductDetailClient } from "@/components/features/product/ProductDetailClient";
import { getCatalogProductBySlug, getProductDetailBySlug } from "@/lib/catalog";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getCatalogProductBySlug(id);
  const productDetail = await getProductDetailBySlug(id);

  if (!product || !productDetail) return notFound();

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <ProductDetailClient product={product} productId={productDetail.id} />
    </div>
  );
}

