import React from 'react';
import { ArrowUp, Target } from 'lucide-react';

const MOVES = [
  { text: "Book the food-handler exam", time: "Tonight, 20 mins" },
  { text: "Draft the café pitch with me", time: "Tomorrow" },
  { text: "Walk into Fern & Grounds with samples", time: "Friday, pre-10am" }
];

const ITEMS = [
  {
    name: "Food-handler certification",
    metrics: "Easy · High impact",
    verdict: "START",
    color: "text-[#00FF66]",
    bg: "bg-[#00FF66]/10",
    border: "border-[#00FF66]/20",
    coach: "Book the exam tonight. Twenty minutes. You've spent longer avoiding it."
  },
  {
    name: "Wholesale pitch: three local cafés",
    metrics: "Medium · High impact",
    verdict: "START",
    color: "text-[#00FF66]",
    bg: "bg-[#00FF66]/10",
    border: "border-[#00FF66]/20",
    coach: "Draft the one-pager with me tomorrow. Bring your three best bakes."
  },
  {
    name: "Finish the website",
    metrics: "Med · Med impact",
    verdict: "SCHEDULE",
    color: "text-[#FFB800]",
    bg: "bg-[#FFB800]/10",
    border: "border-[#FFB800]/20",
    coach: "After two cafés say yes. A pitch needs a menu, not a homepage."
  },
  {
    name: "Commercial kitchen lease",
    metrics: "Hard · High impact",
    verdict: "GET HELP",
    color: "text-[#00CCFF]",
    bg: "bg-[#00CCFF]/10",
    border: "border-[#00CCFF]/20",
    coach: "County permits first — verify those yourself before signing anything. Nothing irreversible in month one."
  },
  {
    name: "Instagram content calendar",
    metrics: "Easy · Low impact",
    verdict: "SKIP FOR NOW",
    color: "text-[#FF3366]",
    bg: "bg-[#FF3366]/10",
    border: "border-[#FF3366]/20",
    coach: "Posting more won't fix distribution. Revisit when a café asks where to find you."
  },
  {
    name: "Custom cake orders",
    metrics: "Med · Low impact",
    verdict: "SKIP FOR NOW",
    color: "text-[#FF3366]",
    bg: "bg-[#FF3366]/10",
    border: "border-[#FF3366]/20",
    coach: "They pay today and steal next year. Cap them at two a month."
  }
];

const BoardItem = ({ item }: { item: typeof ITEMS[0] }) => (
  <div className="bg-[#111111] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-3 w-full shadow-sm hover:border-white/20 transition-colors">
    <div className={`inline-flex w-max items-center px-1.5 py-0.5 rounded-[4px] border ${item.bg} ${item.border} ${item.color} font-mono text-[9px] uppercase tracking-widest font-bold`}>
      {item.verdict}
    </div>
    <div>
      <h3 className="font-outfit text-[14px] font-medium text-white/90 leading-snug mb-1">
        {item.name}
      </h3>
      <p className="font-mono text-[9px] text-white/40 uppercase tracking-wide">
        {item.metrics.split('·')[0].trim()} <span className="mx-0.5 opacity-50">·</span> {item.metrics.split('·')[1].trim()}
      </p>
    </div>
    <div className="w-6 h-[1px] bg-white/10 my-0.5"></div>
    <p className="font-outfit text-[12px] text-white/70 leading-relaxed">
      "{item.coach}"
    </p>
  </div>
);

const CoachsBetCard = () => (
  <div className="relative bg-[#1A1810] border border-[#FFB800]/30 rounded-2xl p-5 overflow-hidden shadow-[0_4px_20px_rgba(255,184,0,0.05)]">
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    
    <div className="flex items-center justify-between mb-3 relative">
      <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#FFB800]/70">The Coach's Bet</h3>
      <Target className="w-4 h-4 text-[#FFB800]/40" />
    </div>
    
    <p className="font-outfit text-[15px] font-medium leading-relaxed relative text-white/90">
      "The website is where you'll hide. Polishing fonts feels like progress and risks nothing. Catch yourself doing it, close the tab, and send one pitch email instead."
    </p>
  </div>
);

const InterviewCard = () => (
  <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 font-outfit shadow-sm relative overflow-hidden">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-sm bg-white/20"></div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-white/40 font-bold">Origin Context</span>
    </div>
    
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="w-4 h-4 rounded-[4px] bg-white/10 flex items-center justify-center text-white/50 text-[8px] font-bold font-mono mt-0.5 shrink-0">C</div>
        <div className="flex-1 text-[13px] text-white/50 leading-relaxed">
          "You bake every Saturday and sell out by noon. What does the version that pays rent look like, 12 months out? Numbers, not adjectives — accounts, hours, dollars."
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-4 h-4 rounded-[4px] bg-white/90 flex items-center justify-center text-black text-[8px] font-bold font-mono mt-0.5 shrink-0">M</div>
        <div className="flex-1 text-[13px] text-white/90 leading-relaxed font-medium">
          "Maybe 10 wholesale accounts? I've got 10 hours a week and about $2,000 I could spend without panicking. The website's half-built and I still haven't booked the food-handler cert."
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-4 h-4 rounded-[4px] bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center text-[8px] font-bold font-mono mt-0.5 shrink-0">C</div>
        <div className="flex-1 text-[13px] text-white/70 leading-relaxed">
          "Demand isn't your problem — sell-out Saturdays settled that. The cert is a 20-minute signup you've dodged for months. That's fear dressed up as busy. It goes first."
        </div>
      </div>
    </div>
  </div>
);

const CheckInCard = () => (
  <div className="bg-[#0A0A0A] border border-dashed border-white/20 rounded-2xl p-4 font-outfit">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full bg-[#00CCFF] shadow-[0_0_8px_#00CCFF]"></div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-white/50 font-bold">Latest Check-in</span>
    </div>
    
    <div className="space-y-3 pl-3 border-l border-white/10 ml-1">
      <div className="relative">
        <div className="absolute -left-[15px] top-1.5 w-1.5 h-1.5 rounded-full bg-white/30"></div>
        <p className="text-[13px] text-white/60 leading-relaxed">
          <span className="text-white/30 font-mono text-[10px] mr-2">M:</span>
          "Booked the cert. Also redesigned the menu page twice."
        </p>
      </div>
      <div className="relative">
        <div className="absolute -left-[15px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#FFB800] shadow-[0_0_8px_rgba(255,184,0,0.5)]"></div>
        <p className="text-[13px] text-white/90 leading-relaxed font-medium">
          <span className="text-[#FFB800] font-mono text-[10px] mr-2">C:</span>
          "The cert was the one that counted — good. The menu page is the hiding spot. Close the tab. One pitch email before Friday."
        </p>
      </div>
    </div>
  </div>
);

const PinnedSection = () => (
  <div className="bg-[#111111] pb-6 px-4 rounded-b-3xl border-b border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative z-10 animate-fade-up">
    <div className="pt-6 pb-6 flex justify-between items-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Next Leap</div>
      <div className="flex gap-1 opacity-50">
        <div className="w-1 h-1 rounded-full bg-white"></div>
        <div className="w-1 h-1 rounded-full bg-white"></div>
        <div className="w-1 h-1 rounded-full bg-white"></div>
      </div>
    </div>
    
    <h1 className="font-outfit text-[22px] text-white font-medium leading-tight mb-6">
      Maya's Next Moves
    </h1>
    
    <div className="space-y-4">
      {/* Move 1 - Active */}
      <div className="flex gap-4 items-start group">
        <div className="w-5 h-5 rounded-full bg-[#00FF66]/20 flex items-center justify-center flex-shrink-0 mt-0.5 relative">
          <div className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></div>
        </div>
        <div>
          <p className="font-outfit text-white/90 text-[15px] leading-snug mb-0.5 font-medium group-hover:text-[#00FF66] transition-colors">{MOVES[0].text}</p>
          <p className="font-mono text-white/40 text-[10px] uppercase tracking-wide">{MOVES[0].time}</p>
        </div>
      </div>
      
      {/* Move 2 */}
      <div className="flex gap-4 items-start">
        <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-white/30 font-mono text-[9px]">2</div>
        <div>
          <p className="font-outfit text-white/70 text-[15px] leading-snug mb-0.5">{MOVES[1].text}</p>
          <p className="font-mono text-white/40 text-[10px] uppercase tracking-wide">{MOVES[1].time}</p>
        </div>
      </div>
      
      {/* Move 3 */}
      <div className="flex gap-4 items-start">
        <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-white/30 font-mono text-[9px]">3</div>
        <div>
          <p className="font-outfit text-white/70 text-[15px] leading-snug mb-0.5">{MOVES[2].text}</p>
          <p className="font-mono text-white/40 text-[10px] uppercase tracking-wide">{MOVES[2].time}</p>
        </div>
      </div>
    </div>
  </div>
);

export default function Pinboard() {
  return (
    <div className="w-full min-h-screen bg-[#000000] text-white relative font-sans selection:bg-[#00FF66]/30 flex justify-center overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>
      
      {/* Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <div className="w-full max-w-[390px] min-h-screen relative flex flex-col no-scrollbar overflow-y-auto">
        <PinnedSection />
        
        <div className="px-4 py-5 space-y-4">
          <div className="animate-fade-up delay-100">
            <InterviewCard />
          </div>
          
          <div className="grid grid-cols-2 gap-3 items-start animate-fade-up delay-200">
            <BoardItem item={ITEMS[0]} />
            <BoardItem item={ITEMS[1]} />
          </div>
          
          <div className="animate-fade-up delay-300">
            <CoachsBetCard />
          </div>
          
          <div className="grid grid-cols-2 gap-3 items-start animate-fade-up delay-400">
            <div className="flex flex-col gap-3">
              <BoardItem item={ITEMS[2]} />
              <BoardItem item={ITEMS[4]} />
            </div>
            <div className="flex flex-col gap-3">
              <BoardItem item={ITEMS[3]} />
              <BoardItem item={ITEMS[5]} />
            </div>
          </div>
          
          <div className="animate-fade-up delay-500">
            <CheckInCard />
          </div>
          
          {/* Spacer for bottom bar */}
          <div className="h-28 w-full"></div>
        </div>

        {/* Input Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] p-4 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent pointer-events-none pb-6 z-50 animate-fade-up delay-500">
          <div className="bg-[#1A1A1A]/90 border border-white/10 rounded-full p-1.5 pl-5 flex items-center gap-3 pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all focus-within:border-white/30 focus-within:bg-[#222]/90">
            <input 
              type="text" 
              placeholder="Ask the coach..." 
              className="flex-1 bg-transparent border-none outline-none text-white font-outfit text-[14px] placeholder-white/30"
            />
            <button className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 hover:bg-[#00FF66] hover:text-black transition-colors active:scale-95">
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
