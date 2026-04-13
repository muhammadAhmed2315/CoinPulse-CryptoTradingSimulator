import TradesTable from "@/components/TradesTable";
import PortfolioAnalytics from "../components/Dashboard/PortfolioPanel/PortfolioAnalytics";

export default function MyTrades() {
  return (
    <div>
      <PortfolioAnalytics />
      <br />
      <TradesTable />
    </div>
  );
}
