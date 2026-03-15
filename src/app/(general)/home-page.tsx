"use client";

import HomePageHeader from "./_components/homepage-header";
import SimpleAnalytics from "./_components/simple-analytics";
import PerformanceStats from "./_components/performance-stats";
import ActivityStats from "./_components/activity-stats";
import DirectionalAnalysis from "./_components/directional-analysis";
import RiskManagement from "./_components/risk-management";
import TradeCalendar from "./_components/trade-calendar";
import EquityCurve from "./_components/equity-curve";
import TradesList from "./_components/trades-list";
import { useTradeAccountContext } from "@/context/trade-account/trade-account-context";

function HomePage() {
  const { isLoading } = useTradeAccountContext();

  if (isLoading) {
    return <div className="space-y-4"></div>;
  }

  return (
    <div className="space-y-4">
      <HomePageHeader />
      {/* // TODO - add some stats and recent activity here */}
      <SimpleAnalytics />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DirectionalAnalysis className="lg:row-span-2" />
        <PerformanceStats className="lg:col-span-1" />
        <RiskManagement className="lg:col-span-1" />
      </div>
      <ActivityStats />
      <EquityCurve />
      <TradeCalendar />
      <TradesList />
    </div>
  );
}

export default HomePage;
