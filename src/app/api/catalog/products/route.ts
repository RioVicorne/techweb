import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog";

export async function GET() {
  try {
    const products = await getCatalogProducts();
    return NextResponse.json({ products }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

