import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import HomePageHeader from "./_components/homepage-header";
import SimpleAnalytics from "./_components/simple-analytics";
import PerformanceStats from "./_components/performance-stats";
import ActivityStats from "./_components/activity-stats";
import DirectionalAnalysis from "./_components/directional-analysis";
import RiskManagement from "./_components/risk-management";
import TradeCalendar from "./_components/trade-calendar";
import TradesList from "./_components/trades-list";

async function page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user == null) {
    return redirect("/auth/login");
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
      <TradeCalendar />
      <TradesList />
    </div>
  );
}

export default page;
