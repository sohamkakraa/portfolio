import { getDefaultPortfolioData } from "@/lib/portfolio-data";
import PortfolioPage from "@/components/PortfolioPage";

export default function HomePage() {
  const data = getDefaultPortfolioData();
  return <PortfolioPage initialData={data} />;
}
