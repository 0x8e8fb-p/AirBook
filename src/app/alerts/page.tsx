import { AlertsClient } from "./AlertsClient";
import { getAlerts } from "./actions";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <div className="min-h-[100dvh]">
      <AlertsClient initialAlerts={alerts} />
      <Footer />
    </div>
  );
}
