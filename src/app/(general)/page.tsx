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
import EquityCurve from "./_components/equity-curve";
import TradesList from "./_components/trades-list";
import HomePage from "./home-page";

async function page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user == null) {
    return redirect("/auth/login");
  }
  return <HomePage />;
}

export default page;
