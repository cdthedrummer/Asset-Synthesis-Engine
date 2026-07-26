import { useState } from "react";
import { ArrowUp, Clock, Calendar, AlertCircle, X, TrendingUp, CheckCircle2, MessageCircle } from "lucide-react";

export default function Feed() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const verdictConfig = {
    START: { 
      icon: ArrowUp, 
      color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      badge: "text-cyan-400 bg-cyan-400/15"
    },
    SCHEDULE: { 
      icon: Calendar, 
      color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      badge: "text-amber-400 bg-amber-400/15"
    },
    "SKIP FOR NOW": { 
      icon: X, 
      color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
      badge: "text-slate-500 bg-slate-500/15"
    },
    "GET HELP": { 
      icon: AlertCircle, 
      color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      badge: "text-orange-400 bg-orange-400/15"
    }
  };

  const boardItems = [
    {
      id: 1,
      name: "Food-handler certification",
      difficulty: "Easy",
      impact: "High impact",
      verdict: "START" as const,
      reasoning: "Book the exam tonight. Twenty minutes. You've spent longer avoiding it.",
      rank: 1
    },
    {
      id: 2,
      name: "Wholesale pitch: three local cafés",
      difficulty: "Medium",
      impact: "High impact",
      verdict: "START" as const,
      reasoning: "Draft the one-pager with me tomorrow. Bring your three best bakes.",
      rank: 2
    },
    {
      id: 3,
      name: "Finish the website",
      difficulty: "Medium",
      impact: "Medium impact",
      verdict: "SCHEDULE" as const,
      reasoning: "After two cafés say yes. A pitch needs a menu, not a homepage.",
      rank: 3
    },
    {
      id: 4,
      name: "Commercial kitchen lease",
      difficulty: "Hard",
      impact: "High impact",
      verdict: "GET HELP" as const,
      reasoning: "County permits first — verify those yourself before signing anything. Nothing irreversible in month one.",
      rank: 4
    },
    {
      id: 5,
      name: "Instagram content calendar",
      difficulty: "Easy",
      impact: "Low impact",
      verdict: "SKIP FOR NOW" as const,
      reasoning: "Posting more won't fix distribution. Revisit when a café asks where to find you.",
      rank: 5
    },
    {
      id: 6,
      name: "Custom cake orders",
      difficulty: "Medium",
      impact: "Low impact",
      verdict: "SKIP FOR NOW" as const,
      reasoning: "They pay today and steal next year. Cap them at two a month.",
      rank: 6
    }
  ];

  const nextMoves = [
    { id: 1, action: "Book the food-handler exam", timeframe: "tonight, 20 minutes" },
    { id: 2, action: "Draft the café pitch with me", timeframe: "tomorrow" },
    { id: 3, action: "Walk into Fern & Grounds with samples", timeframe: "Friday, before the 10am rush" }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0b] text-slate-100 font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        
        .feed-container { font-family: 'Inter', sans-serif; }
        .heading-font { font-family: 'Space Grotesk', sans-serif; }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .item-1 { animation-delay: 0.05s; }
        .item-2 { animation-delay: 0.1s; }
        .item-3 { animation-delay: 0.15s; }
        .item-4 { animation-delay: 0.2s; }
        .item-5 { animation-delay: 0.25s; }
        .item-6 { animation-delay: 0.3s; }
        .item-7 { animation-delay: 0.35s; }
        .item-8 { animation-delay: 0.4s; }
        .item-9 { animation-delay: 0.45s; }
      `}</style>

      <div className="feed-container max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-slate-800/50 z-10 px-4 py-3 slide-up">
          <div className="flex items-center justify-between">
            <h1 className="heading-font text-sm font-semibold text-slate-400 tracking-wide">Next Leap</h1>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-slow"></div>
              <span className="text-xs font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Pinned: Next Three Moves */}
        <div className="px-4 py-4 border-b border-slate-800/50 bg-gradient-to-b from-cyan-500/5 to-transparent slide-up item-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-cyan-400/15 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="heading-font text-xs font-semibold text-cyan-400 uppercase tracking-wider">Pinned · Next 48 Hours</span>
          </div>
          <div className="space-y-2">
            {nextMoves.map((move, idx) => (
              <div key={move.id} className="flex gap-3 group">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-slate-400">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100 leading-tight">{move.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{move.timeframe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bet Card */}
        <div className="px-4 py-4 border-b border-slate-800/50 slide-up item-2">
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-bold heading-font text-cyan-400">C</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-400 heading-font">Coach's Bet</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  My bet: the website is where you'll hide. Polishing fonts feels like progress and risks nothing. Catch yourself doing it, close the tab, and send one pitch email instead.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Board Items Feed */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="heading-font text-xs font-semibold text-slate-500 uppercase tracking-wider">Ranked by priority</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {boardItems.map((item, idx) => {
            const config = verdictConfig[item.verdict];
            const Icon = config.icon;
            const isExpanded = expandedItem === item.id;

            return (
              <div 
                key={item.id} 
                className={`px-4 py-4 slide-up item-${idx + 3} cursor-pointer hover:bg-slate-900/30 transition-colors`}
                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                    <span className="heading-font text-base font-bold text-slate-600">#{item.rank}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Item Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="heading-font text-sm font-semibold text-slate-100 leading-tight">{item.name}</h3>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-md border ${config.color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge} border border-current/10`}>
                        {item.verdict}
                      </span>
                      <span className="text-xs text-slate-500">{item.difficulty}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{item.impact}</span>
                    </div>

                    {/* Reasoning (expandable) */}
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <p className="text-sm text-slate-400 leading-relaxed pt-2 border-t border-slate-800/50">
                        {item.reasoning}
                      </p>
                    </div>

                    {/* Tap hint when collapsed */}
                    {!isExpanded && (
                      <button className="text-xs text-slate-600 hover:text-slate-500 mt-1 flex items-center gap-1">
                        <span>Tap for reasoning</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Check-in Exchange */}
        <div className="px-4 py-4 mt-2 border-t border-slate-800/50 slide-up item-9">
          <div className="space-y-4">
            {/* Maya's check-in */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <span className="text-sm font-bold heading-font text-purple-400">M</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-300">Maya</span>
                  <span className="text-xs text-slate-600">2h ago</span>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Booked the cert. Also redesigned the menu page twice.
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-2 px-1">
                  <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-500 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-xs">1</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Coach's reply */}
            <div className="flex gap-3 ml-8">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-bold heading-font text-cyan-400">C</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-300">Coach</span>
                  <span className="text-xs text-slate-600">2h ago</span>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    The cert was the one that counted — good. The menu page is the hiding spot. Close the tab. One pitch email before Friday.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Exchange */}
        <div className="px-4 py-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="heading-font text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview</span>
          </div>
          
          <div className="space-y-4">
            {/* Coach question */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-bold heading-font text-cyan-400">C</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-300">Coach</span>
                  <span className="text-xs text-slate-600">3d ago</span>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    You bake every Saturday and sell out by noon. What does the version that pays rent look like, 12 months out? Numbers, not adjectives — accounts, hours, dollars.
                  </p>
                </div>
              </div>
            </div>

            {/* Maya's answer */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <span className="text-sm font-bold heading-font text-purple-400">M</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-300">Maya</span>
                  <span className="text-xs text-slate-600">3d ago</span>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Maybe 10 wholesale accounts? I've got 10 hours a week and about $2,000 I could spend without panicking. The website's half-built and I still haven't booked the food-handler cert.
                  </p>
                </div>
              </div>
            </div>

            {/* Coach's verdict */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-bold heading-font text-cyan-400">C</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-300">Coach</span>
                  <span className="text-xs text-slate-600">3d ago</span>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Demand isn't your problem — sell-out Saturdays settled that. The cert is a 20-minute signup you've dodged for months. That's fear dressed up as busy. It goes first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
