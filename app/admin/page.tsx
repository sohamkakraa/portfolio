import { getDefaultPortfolioData } from "@/lib/portfolio-data";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata = {
  title: "Admin · Soham Kakra",
  robots: "noindex, nofollow",
};

export default function AdminPage() {
  const data = getDefaultPortfolioData();
  return <AdminPanel defaultData={data} />;
}
