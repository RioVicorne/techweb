import type { Metadata } from "next";
import { AdminLayoutClient } from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: "Admin — RioTranShop",
  description: "Bảng điều khiển quản trị",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
