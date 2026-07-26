import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCreateProject, useUpdateProject, getListProjectsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Project, ProjectInputCategory, ProjectInputVerdict, ProjectInputEnergy } from "@workspace/api-client-react"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["work", "personal", "life"]),
  verdict: z.enum(["lead", "delegate", "partner", "publish", "park", "kill"]),
  status: z.string().min(1, "Status is required"),
  difficulty: z.coerce.number().min(1).max(10),
  upside: z.coerce.number().min(1).max(10),
  traction: z.coerce.number().min(1).max(5),
  energy: z.enum(["drains", "neutral", "energizes"]),
  oneLineTruth: z.string().min(1, "One line truth is required"),
  nextProofPoint: z.string().min(1, "Next proof point is required"),
  aiRuling: z.string().optional(),
  isActiveBet: z.boolean().default(false),
})

export function ProjectForm({ project, open, onOpenChange }: { project?: Project, open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: project ? {
      name: project.name,
      category: project.category as any,
      verdict: project.verdict as any,
      status: project.status,
      difficulty: project.difficulty,
      upside: project.upside,
      traction: project.traction,
      energy: project.energy as any,
      oneLineTruth: project.oneLineTruth,
      nextProofPoint: project.nextProofPoint,
      aiRuling: project.aiRuling,
      isActiveBet: project.isActiveBet,
    } : {
      name: "",
      category: "work",
      verdict: "park",
      status: "",
      difficulty: 5,
      upside: 5,
      traction: 1,
      energy: "neutral",
      oneLineTruth: "",
      nextProofPoint: "",
      aiRuling: "",
      isActiveBet: false,
    }
  })

  // Reset form when project changes
  React.useEffect(() => {
    if (open) {
      if (project) {
        form.reset({
          name: project.name,
          category: project.category as any,
          verdict: project.verdict as any,
          status: project.status,
          difficulty: project.difficulty,
          upside: project.upside,
          traction: project.traction,
          energy: project.energy as any,
          oneLineTruth: project.oneLineTruth,
          nextProofPoint: project.nextProofPoint,
          aiRuling: project.aiRuling,
          isActiveBet: project.isActiveBet,
        })
      } else {
        form.reset({
          name: "",
          category: "work",
          verdict: "park",
          status: "",
          difficulty: 5,
          upside: 5,
          traction: 1,
          energy: "neutral",
          oneLineTruth: "",
          nextProofPoint: "",
          aiRuling: "",
          isActiveBet: false,
        })
      }
    }
  }, [project, open, form])

  const onSubmit = (data: z.infer<typeof schema>) => {
    if (project) {
      updateProject.mutate({ id: project.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() })
          onOpenChange(false)
        }
      })
    } else {
      createProject.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() })
          onOpenChange(false)
        }
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="life">Life</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="verdict" render={({ field }) => (
                <FormItem>
                  <FormLabel>Verdict</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="delegate">Delegate</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="publish">Publish</SelectItem>
                      <SelectItem value="park">Park</SelectItem>
                      <SelectItem value="kill">Kill</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="difficulty" render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty (1-10)</FormLabel>
                  <FormControl><Input type="number" min={1} max={10} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="upside" render={({ field }) => (
                <FormItem>
                  <FormLabel>Upside (1-10)</FormLabel>
                  <FormControl><Input type="number" min={1} max={10} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="traction" render={({ field }) => (
                <FormItem>
                  <FormLabel>Traction (1-5)</FormLabel>
                  <FormControl><Input type="number" min={1} max={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="energy" render={({ field }) => (
                <FormItem>
                  <FormLabel>Energy</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="energizes">Energizes</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="drains">Drains</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Current Status</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="oneLineTruth" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>One Line Truth</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nextProofPoint" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Next Proof Point</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="aiRuling" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>AI Ruling (Optional)</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createProject.isPending || updateProject.isPending}>
                {project ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
