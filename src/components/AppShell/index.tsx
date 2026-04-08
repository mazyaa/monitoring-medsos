import { cn } from "@/lib/utils"

type AppShellProps = {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fafaf9,#f5f5f4_38%,#f1f5f9)]">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Social Intelligence
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Social Dashboard
            </h1>
          </div>
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8", className)}>
        {children}
      </main>
    </div>
  )
}
