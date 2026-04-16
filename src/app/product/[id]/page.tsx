import { notFound } from "next/navigation";
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
      <ProductDetailClient
        product={product}
        productId={productDetail.id}
        imageUrls={productDetail.images.map((image) => image.url)}
      />
    </div>
  );
}

