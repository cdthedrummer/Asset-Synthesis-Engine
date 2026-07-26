import * as React from "react"
import { useGetTodayBrief, useGenerateBrief, useListBriefs, getGetTodayBriefQueryKey, getListBriefsQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Radio, RefreshCw, Play, Pause } from "lucide-react"
import { format } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"

function MarkdownRenderer({ content }: { content: string }) {
  // Ultra-simple markdown rendering for the brief.
  // Escape HTML first so AI/user-derived content can never inject markup.
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
  const html = escaped
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-serif font-bold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-serif font-bold mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-serif font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
    .replace(/\n\n/gim, '<br/><br/>')
    .replace(/- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')

  return (
    <div 
      className="prose prose-invert max-w-none text-muted-foreground leading-relaxed prose-headings:text-foreground prose-strong:text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function Pulse() {
  const queryClient = useQueryClient()
  const { data: todayBrief, isLoading, error } = useGetTodayBrief()
  const generateBrief = useGenerateBrief()
  const { data: pastBriefs } = useListBriefs({ limit: 5 })

  const is404 = error?.message?.includes("404") || (error as any)?.status === 404 || !todayBrief

  const handleGenerate = () => {
    generateBrief.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTodayBriefQueryKey() })
        queryClient.invalidateQueries({ queryKey: getListBriefsQueryKey() })
      }
    })
  }

  const [isPlaying, setIsPlaying] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <header className="flex justify-between items-end mb-12 border-b border-border pb-6">
        <div>
          <h2 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" />
            The Daily Pulse
          </h2>
          <p className="text-muted-foreground">AI-synthesized morning briefing.</p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={generateBrief.isPending}
          className="bg-primary text-primary-foreground"
        >
          {generateBrief.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Radio className="w-4 h-4 mr-2" />
          )}
          {generateBrief.isPending ? "Generating..." : "Generate Today's Brief"}
        </Button>
      </header>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse">Checking for today's brief...</div>
      ) : is404 && !generateBrief.isPending ? (
        <div className="text-center py-32 border border-border border-dashed bg-card/30">
          <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-serif mb-2">No brief generated yet today</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get the unvarnished truth about your portfolio's movement over the last 24 hours.
          </p>
          <Button onClick={handleGenerate} variant="outline" size="lg">
            Generate Now
          </Button>
        </div>
      ) : generateBrief.isPending ? (
        <div className="text-center py-32">
          <RefreshCw className="w-12 h-12 text-primary mx-auto mb-6 animate-spin" />
          <h3 className="text-2xl font-serif mb-2">Synthesizing...</h3>
          <p className="text-muted-foreground">Analyzing recent check-ins, extracting signal from noise. This takes about 30 seconds.</p>
        </div>
      ) : todayBrief && (
        <article className="bg-card border border-border p-8 md:p-12 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none" />
          <div className="text-sm text-primary uppercase tracking-widest mb-4 font-bold">
            {format(new Date(todayBrief.briefDate), 'EEEE, MMMM d')}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-8">
            {todayBrief.headline}
          </h1>

          {todayBrief.hasAudio && (
            <div className="bg-background border border-border p-4 mb-8 flex items-center gap-4">
              <Button size="icon" className="rounded-full w-12 h-12 flex-shrink-0" onClick={toggleAudio}>
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </Button>
              <div>
                <div className="font-bold text-sm uppercase tracking-wider mb-1">Listen to Brief</div>
                <div className="text-xs text-muted-foreground">AI Podcast Synthesis</div>
              </div>
              <audio 
                ref={audioRef} 
                src={`${import.meta.env.BASE_URL}api/briefs/${todayBrief.id}/audio`} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          )}

          <div className="mt-8 border-t border-border pt-8">
            <MarkdownRenderer content={todayBrief.content} />
          </div>
        </article>
      )}

      {pastBriefs && pastBriefs.length > 0 && (
        <section className="mt-16">
          <h3 className="text-xl font-serif font-bold mb-6 text-muted-foreground">Past Briefs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastBriefs.filter(b => b.id !== todayBrief?.id).map(brief => (
              <div key={brief.id} className="p-6 bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  {format(new Date(brief.briefDate), 'MMM d, yyyy')}
                </div>
                <h4 className="font-serif font-bold text-lg leading-snug">{brief.headline}</h4>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
