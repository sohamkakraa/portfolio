import { cookies } from "next/headers";
import { getDefaultPortfolioData } from "@/lib/portfolio-data";
import { verifySessionToken } from "@/lib/auth";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata = {
  title: "Admin · Soham Kakra",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");

  let initialAuthenticated = false;
  if (sessionCookie?.value) {
    try {
      const session = await verifySessionToken(sessionCookie.value);
      initialAuthenticated = !!session;
    } catch {
      initialAuthenticated = false;
    }
  }

  const data = getDefaultPortfolioData();
  return <AdminPanel defaultData={data} initialAuthenticated={initialAuthenticated} />;
}
