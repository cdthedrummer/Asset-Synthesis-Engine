import * as React from "react"
import { useGetProject, useCreateCheckin, useDeleteProject, getListProjectsQueryKey, getGetProjectQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ProjectForm } from "./ProjectForm"

export function ProjectDossier({ projectId, open, onOpenChange }: { projectId: number | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const { data: project, isLoading } = useGetProject(projectId!, { query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId!) } })
  const createCheckin = useCreateCheckin()
  const deleteProject = useDeleteProject()
  
  const [mood, setMood] = React.useState<"moved" | "stalled" | "blocked" | "shipped" | "idea">("moved")
  const [note, setNote] = React.useState("")
  const [isEditing, setIsEditing] = React.useState(false)

  const submitCheckin = () => {
    if (!projectId || !note.trim()) return
    createCheckin.mutate({ id: projectId, data: { mood, note } }, {
      onSuccess: () => {
        setNote("")
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) })
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() })
      }
    })
  }

  const handleDelete = () => {
    if (!projectId || !confirm("Are you sure you want to delete this project?")) return
    deleteProject.mutate({ id: projectId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() })
        onOpenChange(false)
      }
    })
  }

  if (!projectId) return null

  return (
    <>
      <Dialog open={open && !isEditing} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-border bg-background">
          {isLoading || !project ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dossier...</div>
          ) : (
            <div className="flex flex-col h-[85vh]">
              {/* Header */}
              <div className={`p-6 border-b border-border flex items-start justify-between verdict-bg-${project.verdict}`}>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="bg-background/20 text-current border-none">
                      {project.category.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium tracking-widest uppercase opacity-80">
                      Verdict: {project.verdict}
                    </span>
                  </div>
                  <h2 className="text-4xl font-serif font-bold leading-tight">{project.name}</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-background/10 text-current border-current/20 hover:bg-background/20" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="bg-background/10 text-current border-current/20 hover:bg-background/20" onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* The Blunt Truth */}
                <section>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">The Blunt Truth</h3>
                  <p className="text-xl font-medium leading-relaxed">{project.oneLineTruth}</p>
                </section>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-card border border-border">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Difficulty</div>
                    <div className="text-2xl font-serif font-bold">{project.difficulty}<span className="text-sm text-muted-foreground">/10</span></div>
                  </div>
                  <div className="p-4 bg-card border border-border">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Upside</div>
                    <div className="text-2xl font-serif font-bold">{project.upside}<span className="text-sm text-muted-foreground">/10</span></div>
                  </div>
                  <div className="p-4 bg-card border border-border">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Traction</div>
                    <div className="text-2xl font-serif font-bold">{project.traction}<span className="text-sm text-muted-foreground">/5</span></div>
                  </div>
                  <div className="p-4 bg-card border border-border">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Energy</div>
                    <div className={`text-lg font-medium capitalize ${project.energy === 'drains' ? 'text-destructive' : project.energy === 'energizes' ? 'text-verdict-lead' : 'text-muted-foreground'}`}>
                      {project.energy}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current Status</h3>
                      <p className="text-sm">{project.status}</p>
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Next Proof Point</h3>
                      <p className="text-sm">{project.nextProofPoint}</p>
                    </div>
                    {project.aiRuling && (
                      <div className="p-4 bg-accent/30 border border-accent">
                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">AI Ruling</h3>
                        <p className="text-sm font-serif italic text-muted-foreground">{project.aiRuling}</p>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 flex flex-col h-full">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Recent Check-ins</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] border border-border bg-card p-4">
                      {project.checkins?.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No check-ins yet.</p>
                      )}
                      {project.checkins?.map(c => (
                        <div key={c.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider">{c.mood}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{c.note}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex gap-2 mb-2">
                        {(["moved", "shipped", "idea", "stalled", "blocked"] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMood(m)}
                            className={`text-xs px-2 py-1 uppercase tracking-wider border ${mood === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Textarea 
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="Quick 15-second check-in..."
                          className="min-h-[40px] h-[40px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault()
                              submitCheckin()
                            }
                          }}
                        />
                        <Button 
                          onClick={submitCheckin} 
                          disabled={!note.trim() || createCheckin.isPending}
                          className="h-[40px]"
                        >
                          Log
                        </Button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {project && <ProjectForm 
        project={project} 
        open={isEditing} 
        onOpenChange={(v) => {
          setIsEditing(v)
          if (!v) onOpenChange(true) // reopen dossier when closing edit
        }} 
      />}
    </>
  )
}
