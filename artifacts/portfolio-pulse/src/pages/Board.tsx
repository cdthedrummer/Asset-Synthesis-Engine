import * as React from "react"
import { useListProjects } from "@workspace/api-client-react"
import { ProjectDossier } from "@/components/ProjectDossier"
import { ProjectForm } from "@/components/ProjectForm"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Project } from "@workspace/api-client-react"

export default function Board() {
  const { data: projects = [], isLoading } = useListProjects()
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading the board...</div>
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold mb-2">The Board</h2>
          <p className="text-muted-foreground">Difficulty vs Upside. Every project mapped.</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex-1 relative bg-card border border-border overflow-hidden min-h-[600px]">
        {/* Axes & Quadrant Labels */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/50" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-border/50" />
          
          <div className="absolute top-4 left-4 text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-50">Quick Wins</div>
          <div className="absolute top-4 right-4 text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-50">Big Bets</div>
          <div className="absolute bottom-4 left-4 text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-50">Chores</div>
          <div className="absolute bottom-4 right-4 text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-50">Time Sinks</div>
          
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground tracking-widest uppercase">Difficulty ➔</div>
          <div className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground tracking-widest uppercase">Upside ➔</div>
        </div>

        {/* Tokens */}
        {projects.map(project => {
          // Normalize 1-10 to 5%-95% to keep tokens inside bounds
          const x = 5 + ((project.difficulty - 1) / 9) * 90
          const y = 95 - ((project.upside - 1) / 9) * 90 // inverted Y
          
          // Size by traction: 1-5 -> 16px to 48px
          const size = 16 + (project.traction - 1) * 8

          return (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 verdict-bg-${project.verdict} hover:scale-110 transition-transform shadow-lg cursor-pointer group focus:outline-none focus:ring-4 focus:ring-primary/20 flex items-center justify-center`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderColor: 'var(--background)'
              }}
              title={`${project.name} (Traction: ${project.traction})`}
            >
              {project.isActiveBet && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-background animate-pulse" />
              )}
              <span className="sr-only">{project.name}</span>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
                {project.name}
              </div>
            </button>
          )
        })}
      </div>

      <ProjectDossier 
        projectId={selectedProjectId} 
        open={!!selectedProjectId} 
        onOpenChange={(v) => !v && setSelectedProjectId(null)} 
      />
      
      <ProjectForm 
        open={isCreating} 
        onOpenChange={setIsCreating} 
      />
    </div>
  )
}
