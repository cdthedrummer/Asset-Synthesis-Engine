import { useGetDashboardSummary, useListRecentCheckins } from "@workspace/api-client-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default function Plan() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary()
  const { data: checkins, isLoading: checkinsLoading } = useListRecentCheckins({ limit: 10 })

  if (summaryLoading || checkinsLoading || !summary) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading operating plan...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-12">
      <header>
        <h2 className="text-4xl font-serif font-bold mb-2">Operating Plan</h2>
        <p className="text-muted-foreground">Focus on what matters. Ignore the rest.</p>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-card border border-border">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Total Active</div>
          <div className="text-4xl font-serif font-bold">{summary.totalProjects - summary.verdictCounts.kill - summary.verdictCounts.park}</div>
        </div>
        <div className="p-6 bg-card border border-border">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Check-ins This Week</div>
          <div className="text-4xl font-serif font-bold">{summary.checkinsThisWeek}</div>
        </div>
        <div className="p-6 bg-card border border-destructive/30">
          <div className="text-sm text-destructive uppercase tracking-wider mb-2">Energy Drains</div>
          <div className="text-4xl font-serif font-bold text-destructive">{summary.energyDrains}</div>
        </div>
        <div className="p-6 bg-card border border-border">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Stale Projects</div>
          <div className="text-4xl font-serif font-bold">{summary.staleProjects.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Active Bets & Stale */}
        <div className="md:col-span-2 space-y-12">
          
          <section>
            <h3 className="text-xl font-serif font-bold border-b border-border pb-2 mb-6 flex items-center gap-3">
              The Active Bets
              <Badge className="bg-primary text-primary-foreground">Max 3</Badge>
            </h3>
            <div className="space-y-4">
              {summary.activeBets.length === 0 && (
                <p className="text-muted-foreground italic">No active bets declared.</p>
              )}
              {summary.activeBets.map(bet => (
                <div key={bet.id} className="p-6 bg-card border border-border border-l-4 border-l-primary relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-2xl font-serif font-bold">{bet.name}</h4>
                    <Badge variant="outline" className={`verdict-${bet.verdict} border-none`}>{bet.verdict}</Badge>
                  </div>
                  <p className="text-lg mb-4">"{bet.oneLineTruth}"</p>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest pt-4 border-t border-border/50">
                    Next Proof: {bet.nextProofPoint}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-serif font-bold border-b border-border pb-2 mb-6 text-muted-foreground">
              Needs Attention (Stale)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summary.staleProjects.length === 0 && (
                <p className="text-muted-foreground italic">Nothing stale. Good job.</p>
              )}
              {summary.staleProjects.map(p => (
                <div key={p.id} className="p-4 border border-border bg-card/50">
                  <h4 className="font-bold mb-1">{p.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">Last check-in: {p.lastCheckinAt ? format(new Date(p.lastCheckinAt), 'MMM d') : 'Never'}</p>
                  <Badge variant="outline" className="text-xs uppercase">Update Needed</Badge>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column - Feed */}
        <div className="space-y-6">
          <h3 className="text-xl font-serif font-bold border-b border-border pb-2 mb-6">
            Recent Actions
          </h3>
          <div className="space-y-6">
            {checkins?.map(c => (
              <div key={c.id} className="relative pl-4 border-l-2 border-border pb-1 last:pb-0">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-border" />
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex justify-between">
                  <span>{c.projectName}</span>
                  <span>{format(new Date(c.createdAt), 'MMM d')}</span>
                </div>
                <div className="font-medium text-sm mb-1">{c.mood.toUpperCase()}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
