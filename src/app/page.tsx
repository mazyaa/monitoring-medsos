import { AppShell } from "@/components/AppShell";
import { MonitoringDashboard } from "@/features/monitoringDashboard";
import { SocialDashboard } from "@/features/socialDashboard";

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-10">
        <MonitoringDashboard />

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Live Scraping Workspace
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Existing Query Dashboard
            </h2>
          </div>

          <SocialDashboard />
        </section>
      </div>
    </AppShell>
  );
}
