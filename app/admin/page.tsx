import type { Metadata } from "next";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminPanel from "@/components/admin/AdminPanel";
import { authConfigured, isAdmin } from "@/lib/auth";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — Portfolio CMS", robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin configured={authConfigured()} />;
  return <AdminPanel initial={await getContent()} />;
}
