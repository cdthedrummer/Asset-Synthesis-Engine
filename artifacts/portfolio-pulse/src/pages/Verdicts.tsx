import { useListProjects } from "@workspace/api-client-react"
import { Badge } from "@/components/ui/badge"
import { ProjectVerdict } from "@workspace/api-client-react"

export default function Verdicts() {
  const { data: projects = [], isLoading } = useListProjects()

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading verdicts...</div>
  }

  // Group by verdict
  const grouped = projects.reduce((acc, project) => {
    const v = project.verdict
    if (!acc[v]) acc[v] = []
    acc[v].push(project)
    return acc
  }, {} as Record<string, typeof projects>)

  const verdictsOrder = ["lead", "partner", "delegate", "publish", "park", "kill"]

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-12">
        <h2 className="text-4xl font-serif font-bold mb-2">Verdicts</h2>
        <p className="text-muted-foreground">The blunt truth across all 28+ fronts.</p>
      </div>

      <div className="space-y-16">
        {verdictsOrder.map(verdict => {
          const list = grouped[verdict]
          if (!list || list.length === 0) return null

          return (
            <section key={verdict} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-border pb-2">
                <h3 className={`text-2xl font-serif font-bold capitalize text-verdict-${verdict}`}>
                  {verdict}
                </h3>
                <Badge variant="outline">{list.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map(project => (
                  <div key={project.id} className="p-5 bg-card border border-border group hover:border-muted-foreground transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg">{project.name}</h4>
                      <Badge variant="outline" className="text-[10px] bg-background/50 border-border">
                        {project.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      "{project.oneLineTruth}"
                    </p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest border-t border-border pt-4">
                      <span>Status: {project.status}</span>
                      <span>Next: {project.nextProofPoint}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
