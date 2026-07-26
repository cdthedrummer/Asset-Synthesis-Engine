import * as React from "react"
import { useLocation, Link } from "wouter"
import { BarChart3, LayoutDashboard, Target, Radio, MessageSquare, Briefcase } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "The Board", icon: LayoutDashboard },
  { href: "/plan", label: "Plan", icon: Target },
  { href: "/verdicts", label: "Verdicts", icon: BarChart3 },
  { href: "/pulse", label: "Pulse", icon: Radio },
  { href: "/advisor", label: "Advisor", icon: MessageSquare },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-foreground flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-background" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl leading-none">Portfolio</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Pulse HQ</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                <item.icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-serif font-bold">
              C
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Charlie</p>
              <p className="text-xs text-muted-foreground mt-1">Strategist</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  )
}
