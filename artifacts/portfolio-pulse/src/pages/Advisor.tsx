import * as React from "react"
import { useListOpenaiConversations, useCreateOpenaiConversation, useGetOpenaiConversation, useListOpenaiMessages, getListOpenaiConversationsQueryKey, getListOpenaiMessagesQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Plus, Send } from "lucide-react"

export default function Advisor() {
  const queryClient = useQueryClient()
  const { data: conversations, isLoading: convsLoading } = useListOpenaiConversations()
  const createConversation = useCreateOpenaiConversation()
  
  const [activeId, setActiveId] = React.useState<number | null>(null)
  
  // Set first conversation as active initially
  React.useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id)
    }
  }, [conversations, activeId])

  const { data: messages, isLoading: msgsLoading } = useListOpenaiMessages(activeId!, {
    query: { enabled: !!activeId, queryKey: getListOpenaiMessagesQueryKey(activeId!) }
  })

  const [input, setInput] = React.useState("")
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [streamContent, setStreamContent] = React.useState("")

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamContent])

  const handleNewSession = () => {
    createConversation.mutate({ data: { title: "New Session" } }, {
      onSuccess: (newConv) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() })
        setActiveId(newConv.id)
      }
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeId || isStreaming) return

    const messageContent = input
    setInput("")
    setIsStreaming(true)
    setStreamContent("")

    // Optimistically add user message cache update if we want, or just rely on refetch
    // For simplicity, we just stream, then refetch at the end.

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/openai/conversations/${activeId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (!response.ok || !response.body) throw new Error("Stream failed")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !readerDone })

        // SSE events are delimited by a blank line; keep the trailing
        // partial event in the buffer until it completes.
        const events = buffer.split("\n\n")
        buffer = events.pop() ?? ""

        for (const event of events) {
          for (const line of event.split("\n")) {
            if (!line.startsWith("data: ")) continue
            const data = JSON.parse(line.slice(6))
            if (data.done) {
              done = true
            } else if (data.content) {
              setStreamContent(prev => prev + data.content)
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsStreaming(false)
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(activeId) })
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border">
          <Button onClick={handleNewSession} className="w-full" disabled={createConversation.isPending}>
            <Plus className="w-4 h-4 mr-2" /> New Session
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {convsLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
          ) : conversations?.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-3 py-2 text-sm truncate rounded-sm transition-colors ${activeId === c.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
            >
              <MessageSquare className="w-3 h-3 inline-block mr-2 opacity-50" />
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeId ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8">
              {msgsLoading ? (
                <div className="text-center text-muted-foreground animate-pulse">Loading history...</div>
              ) : messages?.length === 0 && !isStreaming ? (
                <div className="text-center py-20">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-serif mb-2">Advisor Ready</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Ask about portfolio rebalancing, project stagnation, or get a brutal reality check.
                  </p>
                </div>
              ) : (
                messages?.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground leading-relaxed'}`}>
                      {m.role === 'assistant' && <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">Advisor</div>}
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))
              )}
              
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 bg-card border border-border text-foreground leading-relaxed">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">Advisor</div>
                    <div className="whitespace-pre-wrap">{streamContent}</div>
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 bg-background border-t border-border">
              <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
                <Input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask for a reality check..."
                  className="flex-1"
                  disabled={isStreaming}
                />
                <Button type="submit" disabled={!input.trim() || isStreaming}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select or create a session.
          </div>
        )}
      </div>
    </div>
  )
}
