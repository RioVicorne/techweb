import { NextResponse } from "next/server";
import { getCatalogCategories } from "@/lib/catalog";

export async function GET() {
  try {
    const categories = await getCatalogCategories();
    return NextResponse.json(
      {
        categories: categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
