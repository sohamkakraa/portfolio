import { getDefaultPortfolioData } from "@/lib/portfolio-data";
import AdminClient from "@/components/admin/AdminClient";

export default function AdminPage() {
  const data = getDefaultPortfolioData();
  return <AdminClient defaultData={data} />;
}
