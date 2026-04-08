import { AppShell } from "@/components/AppShell";
import { MonitoringDashboard } from "@/features/monitoringDashboard";
import { SocialDashboard } from "@/features/socialDashboard";

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8 lg:space-y-10">
        <section className="space-y-4 rounded-xl border border-border/70 bg-card/65 p-4 shadow-sm backdrop-blur-sm sm:p-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Live Scraping Workspace
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Social Input & Dashboard
            </h2>
          </div>

          <SocialDashboard />
        </section>

        <section className="space-y-4 rounded-xl border border-border/70 bg-card/65 p-4 shadow-sm backdrop-blur-sm sm:p-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Monitoring Overview
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Monitoring Dashboard
            </h2>
          </div>

          <MonitoringDashboard />
        </section>
      </div>
    </AppShell>
  );
}
