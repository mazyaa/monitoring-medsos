import { cn } from "@/lib/utils"
import ShapeGrid from "@/components/ShapeGrid"
import { Toaster } from "../ui/sonner"

type AppShellProps = {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          hoverFillColor="#8400ff"
          shape="square"
          hoverTrailAmount={0}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,0,255,0.18),rgba(16,6,33,0.9)_42%,rgba(6,0,16,0.96))]" />
      </div>

      <header className="relative z-10 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Media Social Monitoring
            </h1>
          </div>
        </div>
      </header>
      <main className={cn("relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8", className)}>
        {children}
      </main>
      <Toaster />
    </div>
  )
}
