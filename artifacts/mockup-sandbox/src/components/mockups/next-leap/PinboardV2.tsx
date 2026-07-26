import React, { useState } from 'react';
import { ArrowUp, X, GripVertical, Plus, ArrowLeft, ChevronRight, Maximize2, ExternalLink } from 'lucide-react';

const MOVES = [
  { text: "Book the food-handler exam", time: "Tonight, 20 mins", pinId: "cert" },
  { text: "Draft the café pitch with me", time: "Tomorrow", pinId: "wholesale" },
  { text: "Walk into Fern & Grounds with samples", time: "Friday, pre-10am", pinId: "wholesale" }
];

const ITEMS = [
  {
    id: "cert",
    name: "Food-handler certification",
    metrics: "Easy · High impact",
    verdict: "START",
    color: "text-[#00FF66]",
    bg: "bg-[#00FF66]/10",
    border: "border-[#00FF66]/20"
  },
  {
    id: "wholesale",
    name: "Wholesale pitch: three local cafés",
    metrics: "Medium · High impact",
    verdict: "START",
    color: "text-[#00FF66]",
    bg: "bg-[#00FF66]/10",
    border: "border-[#00FF66]/20"
  },
  {
    id: "website",
    name: "Finish the website",
    metrics: "Med · Med impact",
    verdict: "SCHEDULE",
    color: "text-[#FFB800]",
    bg: "bg-[#FFB800]/10",
    border: "border-[#FFB800]/20"
  },
  {
    id: "kitchen",
    name: "Commercial kitchen lease",
    metrics: "Hard · High impact",
    verdict: "GET HELP",
    color: "text-[#00CCFF]",
    bg: "bg-[#00CCFF]/10",
    border: "border-[#00CCFF]/20"
  },
  {
    id: "instagram",
    name: "Instagram content calendar",
    metrics: "Easy · Low impact",
    verdict: "SKIP FOR NOW",
    color: "text-[#FF3366]",
    bg: "bg-[#FF3366]/10",
    border: "border-[#FF3366]/20"
  },
  {
    id: "cakes",
    name: "Custom cake orders",
    metrics: "Med · Low impact",
    verdict: "SKIP FOR NOW",
    color: "text-[#FF3366]",
    bg: "bg-[#FF3366]/10",
    border: "border-[#FF3366]/20"
  }
];

const VERDICT_STYLES: Record<string, string> = {
  "START": "text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/20",
  "SCHEDULE": "text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/20",
  "GET HELP": "text-[#00CCFF] bg-[#00CCFF]/10 border-[#00CCFF]/20",
  "SKIP FOR NOW": "text-[#FF3366] bg-[#FF3366]/10 border-[#FF3366]/20"
};

const VERDICT_EXPLANATIONS: Record<string, string> = {
  "START": "Do it in the next 48 hours.",
  "SCHEDULE": "Real, but it has a trigger date.",
  "SKIP FOR NOW": "Costs more than it moves.",
  "GET HELP": "One conversation unblocks it."
};

const RELATED_MAP: Record<string, string[]> = {
  cakes: ['wholesale'],
  website: ['wholesale'],
  cert: ['kitchen'],
  kitchen: ['cert'],
  wholesale: ['cakes', 'website'],
  instagram: []
};

const CHAT_HISTORY: Record<string, Array<{ role: 'user' | 'ai', text: string }>> = {
  cakes: [
    { role: 'user', text: "Can I take the Hendersons' anniversary cake?" },
    { role: 'ai', text: "That's order three this month — one over the cap. It pays $180 today; the same hours on café pitches are worth more by spring. Your call: take it and push the website week, or pass." }
  ]
};

const CertVisual = () => (
  <div className="space-y-3 py-2">
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-[#00FF66] flex items-center justify-center text-black font-mono text-[10px] font-bold shrink-0 shadow-[0_0_12px_rgba(0,255,102,0.4)]">1</div>
      <div className="flex-1">
        <p className="text-white/90 text-[13px] font-medium leading-tight mb-0.5">Book exam</p>
        <p className="text-white/40 text-[10px] font-mono">Tonight, 20 min</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-white/20 flex items-center justify-center text-white/30 font-mono text-[10px] font-bold shrink-0">2</div>
      <div className="flex-1">
        <p className="text-white/50 text-[13px] leading-tight mb-0.5">Take exam</p>
        <p className="text-white/30 text-[10px] font-mono">This week</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-white/10 flex items-center justify-center text-white/20 font-mono text-[10px] font-bold shrink-0">3</div>
      <div className="flex-1">
        <p className="text-white/40 text-[13px] leading-tight mb-0.5">Certified</p>
        <p className="text-white/20 text-[10px] font-mono">Unlocks wholesale</p>
      </div>
    </div>
  </div>
);

const WholesaleVisual = () => (
  <div className="space-y-2.5 py-2">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.6)] shrink-0"></div>
      <div className="flex-1">
        <p className="text-white/90 text-[13px] font-medium">Fern & Grounds</p>
        <p className="text-white/40 text-[10px] font-mono">Samples Friday</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-[#FFB800] shadow-[0_0_8px_rgba(255,184,0,0.4)] shrink-0"></div>
      <div className="flex-1">
        <p className="text-white/80 text-[13px]">Copper Cup</p>
        <p className="text-white/40 text-[10px] font-mono">Draft ready</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full border border-white/30 shrink-0"></div>
      <div className="flex-1">
        <p className="text-white/60 text-[13px]">Marigold Coffee</p>
        <p className="text-white/30 text-[10px] font-mono">Not started</p>
      </div>
    </div>
  </div>
);

const WebsiteVisual = () => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-2">
    <h4 className="text-white/90 text-[12px] font-medium mb-2.5 font-mono tracking-wide">Saturday Menu</h4>
    <div className="space-y-2">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-white/80 text-[12px] truncate">Sourdough Loaf</span>
        <span className="text-white/50 text-[11px] font-mono shrink-0">$9</span>
      </div>
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-white/80 text-[12px] truncate">Morning Buns (4)</span>
        <span className="text-white/50 text-[11px] font-mono shrink-0">$12</span>
      </div>
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-white/80 text-[12px] truncate">Seeded Rye</span>
        <span className="text-white/50 text-[11px] font-mono shrink-0">$8</span>
      </div>
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-white/80 text-[12px] truncate">Galette of the Week</span>
        <span className="text-white/50 text-[11px] font-mono shrink-0">$14</span>
      </div>
    </div>
  </div>
);

const KitchenVisual = () => (
  <div className="space-y-1.5 py-1 text-[11px]">
    <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/10">
      <div className="flex-[2] text-white/40 font-mono text-[9px] uppercase tracking-wider">Permit</div>
      <div className="flex-1 text-white/40 font-mono text-[9px] uppercase tracking-wider">Order</div>
      <div className="flex-1 text-white/40 font-mono text-[9px] uppercase tracking-wider text-right">Status</div>
    </div>
    <div className="flex items-center gap-1.5 py-1">
      <div className="flex-[2] text-white/90 text-[11px] truncate">Food Handler Card</div>
      <div className="flex-1 text-[#00FF66] font-mono text-[10px]">1st</div>
      <div className="flex-1 text-white/60 text-[10px] text-right truncate">booking</div>
    </div>
    <div className="flex items-center gap-1.5 py-1 bg-[#00CCFF]/5 -mx-2 px-2 rounded">
      <div className="flex-[2] text-white/90 text-[11px] truncate">Cottage Food B</div>
      <div className="flex-1 text-[#FFB800] font-mono text-[10px]">2nd</div>
      <div className="flex-1 text-[#00CCFF] text-[10px] underline decoration-dotted text-right truncate">verify</div>
    </div>
    <div className="flex items-center gap-1.5 py-1">
      <div className="flex-[2] text-white/70 text-[11px] truncate">Business License</div>
      <div className="flex-1 text-white/40 font-mono text-[10px]">3rd</div>
      <div className="flex-1 text-white/40 text-[10px] text-right truncate">30 min</div>
    </div>
    <div className="flex items-center gap-1.5 py-1">
      <div className="flex-[2] text-white/50 text-[11px] truncate">Kitchen Agreement</div>
      <div className="flex-1 text-white/30 font-mono text-[10px]">4th</div>
      <div className="flex-1 text-white/30 text-[10px] text-right truncate">after cafés</div>
    </div>
  </div>
);

const InstagramVisual = () => {
  const dates = ['Jul 26', 'Jul 27', 'Jul 28', 'Jul 29', 'Jul 30', 'Jul 31', 'Aug 1'];
  const posts = [0, -1, -1, 3, -1, -1, 0];
  
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-3 w-full">
        {dates.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-mono ${posts[i] === 0 ? 'bg-[#FF3366]/20 text-[#FF3366]' : posts[i] === 3 ? 'bg-white/10 text-white/30' : 'bg-transparent text-white/20'}`}>
              {posts[i] >= 0 ? '●' : ''}
            </div>
            <span className="text-white/30 text-[8px] font-mono">{d.split(' ')[1]}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center gap-2 text-white/70">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF3366] shrink-0"></div>
          <span className="truncate">Sat: sell-out shot</span>
        </div>
        <div className="flex items-center gap-2 text-white/50">
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0"></div>
          <span className="truncate">Wed: proofing timelapse</span>
        </div>
      </div>
    </div>
  );
};

const CakesVisual = () => {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const orders = [3, 4, 5, 6, 8, 9];
  const max = 10;
  const cap = 2;
  
  return (
    <div className="py-2">
      <div className="flex items-end justify-between h-24 mb-2">
        {orders.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full px-0.5">
              <div className="relative">
                <div className="w-full bg-[#FF3366]/20 rounded-t" style={{ height: `${(val / max) * 80}px` }}></div>
                {val > cap && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#FF3366]" style={{ height: `${(cap / max) * 80}px` }}></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-0.5">
        {months.map((m, i) => (
          <span key={i} className="text-white/30 text-[9px] font-mono flex-1 text-center">{m}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="w-3 h-[2px] bg-white/40"></div>
        <span className="text-white/40 text-[10px] font-mono">cap: 2/mo</span>
      </div>
    </div>
  );
};

const VISUALS: Record<string, React.ComponentType> = {
  cert: CertVisual,
  wholesale: WholesaleVisual,
  website: WebsiteVisual,
  kitchen: KitchenVisual,
  instagram: InstagramVisual,
  cakes: CakesVisual
};

const VerdictStamp = ({ verdict, onClick }: { verdict: string, onClick: (e: React.MouseEvent, v: string) => void }) => (
  <button 
    onClick={(e) => onClick(e, verdict)}
    className={`inline-flex w-max items-center px-1.5 py-0.5 rounded-[4px] border ${VERDICT_STYLES[verdict]} font-mono text-[9px] uppercase tracking-widest font-bold active:scale-95 transition-transform relative z-10`}
  >
    {verdict}
  </button>
);

const BoardItem = ({ item, onClick, onVerdictClick }: { item: typeof ITEMS[0], onClick: () => void, onVerdictClick: (e: React.MouseEvent, v: string) => void }) => {
  const Visual = VISUALS[item.id];
  
  return (
    <div 
      onClick={onClick}
      className="bg-[#111111] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2 w-full shadow-sm hover:border-white/20 transition-colors text-left active:scale-[0.98] cursor-pointer"
    >
      <div>
        <VerdictStamp verdict={item.verdict} onClick={onVerdictClick} />
      </div>
      <div className="mt-1">
        <h3 className="font-outfit text-[14px] font-medium text-white/90 leading-snug mb-1">
          {item.name}
        </h3>
        <p className="font-mono text-[9px] text-white/40 uppercase tracking-wide">
          {item.metrics.split('·')[0].trim()} <span className="mx-0.5 opacity-50">·</span> {item.metrics.split('·')[1].trim()}
        </p>
      </div>
      <div className="w-6 h-[1px] bg-white/10 my-0.5"></div>
      {Visual && <Visual />}
    </div>
  );
};

const BeforeAfterCard = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full text-left relative bg-[#1A1810] border border-[#FFB800]/30 rounded-2xl p-5 overflow-hidden shadow-[0_4px_20px_rgba(255,184,0,0.05)] active:scale-[0.98] transition-transform"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    
    <div className="relative">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#FFB800]/50 mb-3">Now</h4>
          <div className="space-y-2 text-[12px]">
            <div className="text-white/60">Saturday-only</div>
            <div className="text-white/90 font-medium">~$400/wk</div>
            <div className="text-white/60">0 wholesale</div>
          </div>
        </div>
        <div>
          <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#FFB800]/70 mb-3">Summer '27</h4>
          <div className="space-y-2 text-[12px]">
            <div className="text-white/80">10 accounts</div>
            <div className="text-[#FFB800] font-medium">~$2,400/wk</div>
            <div className="text-white/80">Menu live</div>
          </div>
        </div>
      </div>
      
      <div className="mt-5 pt-3 border-t border-[#FFB800]/10 flex items-center justify-center gap-2 text-[#FFB800]/40 text-[10px] font-mono uppercase tracking-widest">
        <Maximize2 className="w-3 h-3" /> Tap for trajectory
      </div>
    </div>
  </button>
);

const BULLETS = [
  { text: "Sells out every Saturday by noon", source: "Demand is proven. 'I can't bake fast enough for the farmers market.'" },
  { text: "10 hrs/wk and $2,000 to invest", source: "Your stated risk threshold before the 'day job panic' sets in." },
  { text: "Goal: 10 wholesale accounts by summer '27", source: "The math required to replace your current rent entirely." }
];

const HowWeGotHere = () => {
  const [expanded, setExpanded] = useState<number | null>(null);
  
  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 font-outfit shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-sm bg-white/20"></div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/40 font-bold">How we got here</span>
      </div>
      
      <ul className="space-y-3.5">
        {BULLETS.map((b, i) => (
          <li key={i} className="cursor-pointer group" onClick={() => setExpanded(expanded === i ? null : i)}>
            <div className="flex gap-2 text-[13px] text-white/70 leading-snug group-active:text-white/90 transition-colors">
              <span className="text-white/30 shrink-0 mt-0.5">•</span>
              <span className="flex-1 pr-2">{b.text}</span>
            </div>
            {expanded === i && (
              <div className="mt-2 ml-4 pl-3 border-l border-white/10 text-[11px] text-white/40 font-mono leading-relaxed animate-fade-up">
                {b.source}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const PinnedSection = ({ onPushRoute }: { onPushRoute: (route: any) => void }) => (
  <div className="bg-[#111111] pb-6 px-4 rounded-b-3xl border-b border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative z-10 animate-fade-up">
    <div className="pt-6 pb-5 flex justify-between items-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Next Leap</div>
      <div className="flex gap-1 opacity-50">
        <div className="w-1 h-1 rounded-full bg-white"></div>
        <div className="w-1 h-1 rounded-full bg-white"></div>
        <div className="w-1 h-1 rounded-full bg-white"></div>
      </div>
    </div>
    
    <div className="mb-8">
      <HowWeGotHere />
    </div>
    
    <h1 className="font-outfit text-[22px] text-white font-medium leading-tight mb-5">
      Maya's Next Moves
    </h1>
    
    <div className="space-y-1">
      {MOVES.map((move, idx) => (
        <div
          key={idx}
          onClick={() => onPushRoute({ type: 'pin', id: move.pinId })}
          className="flex gap-3 items-start group w-full text-left cursor-pointer active:scale-[0.98] transition-transform py-2"
        >
          <div className="p-1 -ml-1 active:bg-white/5 rounded cursor-grab" onClick={e => e.stopPropagation()}>
            <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0 group-hover:text-white/40 transition-colors" />
          </div>
          <div className={`${idx === 0 ? 'w-5 h-5 rounded-full bg-[#00FF66]/20' : 'w-5 h-5 rounded-full border border-white/20'} flex items-center justify-center flex-shrink-0 mt-0.5 relative`}>
            {idx === 0 ? (
              <div className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></div>
            ) : (
              <span className="text-white/30 font-mono text-[9px]">{idx + 1}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className={`font-outfit ${idx === 0 ? 'text-white/90 font-medium group-hover:text-[#00FF66]' : 'text-white/70'} text-[15px] leading-snug transition-colors`}>
                {move.text}
              </p>
              <div className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-mono text-white/30 uppercase tracking-wider shrink-0 mt-0.5">
                {ITEMS.find(i => i.id === move.pinId)?.name.split(' ')[0]}
              </div>
            </div>
            <p className="font-mono text-white/40 text-[10px] uppercase tracking-wide">{move.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Breadcrumb = ({ onHome, onBack, title }: { onHome: () => void, onBack?: () => void, title: string }) => (
  <div className="flex items-center gap-1 text-[13px] font-outfit">
    <button onClick={onHome} className="text-white/40 hover:text-white py-2 pr-2 active:scale-95 transition-colors">Board</button>
    <span className="text-white/20 shrink-0">/</span>
    {onBack && (
      <>
        <button onClick={onBack} className="text-white/40 hover:text-white px-2 py-2 active:scale-95 transition-colors">Back</button>
        <span className="text-white/20 shrink-0">/</span>
      </>
    )}
    <span className="text-white/90 pl-1 truncate flex-1">{title}</span>
  </div>
);

const ExpandedCakesView = ({ onBack, onHome }: any) => {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const orders = [3, 4, 5, 6, 8, 9];
  const revenues = orders.map(o => o * 180);
  const maxRev = 1620;
  const capRev = 360;

  return (
    <div className="fixed inset-0 bg-[#000000] z-[60] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-white/10 bg-[#111111]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title="Custom cake orders" />
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <h2 className="font-outfit text-[24px] font-medium text-white/90 mb-2">Revenue vs. Cap</h2>
        <p className="text-[13px] text-white/50 mb-8 leading-relaxed">Each cake pays $180. Cap is 2/mo ($360). Time is better spent on wholesale pitches by fall.</p>
        
        <div className="space-y-6">
          {months.map((m, i) => (
            <div key={m} className="flex items-center gap-4">
              <div className="w-8 text-[11px] font-mono text-white/40 text-right shrink-0">{m}</div>
              <div className="flex-1 h-8 relative bg-white/5 rounded border border-white/5 overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-[#FF3366]/20 flex items-center justify-end pr-2" style={{ width: `${(revenues[i] / maxRev) * 100}%` }}>
                  <span className="text-[10px] font-mono text-[#FF3366]">${revenues[i]}</span>
                </div>
                {revenues[i] > capRev && (
                  <div className="absolute inset-y-0 left-0 bg-[#FF3366] border-r border-[#FF3366] flex items-center px-2" style={{ width: `${(capRev / maxRev) * 100}%` }}>
                    <span className="text-[10px] font-mono text-white/90 font-bold">${capRev}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

const ExpandedInstagramView = ({ onBack, onHome }: any) => {
  const days = Array.from({length: 31}).map((_, i) => i + 1);
  const posts: Record<number, { type: string, text: string }> = {
    4: { type: 'photo', text: 'sell-out shot' },
    8: { type: 'video', text: 'proofing timelapse' },
    15: { type: 'photo', text: 'menu drop' },
    22: { type: 'photo', text: 'sell-out shot' },
    28: { type: 'video', text: 'kitchen tour' }
  };

  return (
    <div className="fixed inset-0 bg-[#000000] z-[60] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-white/10 bg-[#111111]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title="Content calendar" />
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-12">
        <h2 className="font-outfit text-[24px] font-medium text-white/90 mb-6">August 2026</h2>
        
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] font-mono text-white/40">
          <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-10">
          <div className="col-span-6"></div>
          {days.map(d => (
            <div key={d} className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${posts[d] ? 'bg-white/10 border border-white/20' : 'border border-white/5'}`}>
              <span className={`text-[11px] font-mono ${posts[d] ? 'text-white/90' : 'text-white/30'}`}>{d}</span>
              {posts[d] && (
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${posts[d].type === 'video' ? 'bg-white' : 'bg-[#FF3366]'}`}></div>
              )}
            </div>
          ))}
        </div>

        <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4">Planned Posts</h3>
        <div className="space-y-3">
          {Object.entries(posts).map(([d, post]) => (
            <div key={d} className="flex gap-4 p-3.5 bg-[#111111] rounded-xl border border-white/10">
              <div className="w-10 text-[12px] font-mono text-white/40 shrink-0">Aug {d}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-white/90 mb-1 truncate">{post.text}</div>
                <div className="text-[10px] font-mono text-[#FF3366] uppercase tracking-wide">{post.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

const ExpandedKitchenView = ({ onBack, onHome }: any) => {
  const steps = [
    { name: "Food Handler Card", status: "BOOKING NOW", color: "text-[#00FF66]", border: "border-[#00FF66]/30", rationale: "County requires this before you can touch commercial equipment.", link: "County Health Portal" },
    { name: "Cottage Food Class B", status: "VERIFY YOURSELF", color: "text-[#FFB800]", border: "border-[#FFB800]/30", rationale: "Permits indirect sales (wholesale to cafes). Must confirm home kitchen limits.", link: "Class B Requirements" },
    { name: "Business License", status: "30 MIN ONLINE", color: "text-white/60", border: "border-white/10", rationale: "Basic local compliance. Fast, but needs the Cottage Food address.", link: "City Clerk Site" },
    { name: "Kitchen Agreement", status: "AFTER CAFÉS", color: "text-white/40", border: "border-white/5", rationale: "Don't pay rent until the demand is locked in. Wait for two yeses.", link: "Review Lease Template" }
  ];

  return (
    <div className="fixed inset-0 bg-[#000000] z-[60] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-white/10 bg-[#111111]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title="Kitchen permits" />
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-12">
        <h2 className="font-outfit text-[24px] font-medium text-white/90 mb-2">Permit Sequence</h2>
        <p className="text-[13px] text-white/50 mb-8">Strict ordering required. Do not skip steps.</p>
        
        <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-white/10">
          {steps.map((step, i) => (
            <div key={i} className={`bg-[#111111] border ${step.border} rounded-xl p-4 ml-8 relative shadow-sm`}>
              <div className="absolute top-5 -left-[25px] w-3 h-3 rounded-full bg-black border-2 border-white/30 z-10 flex items-center justify-center">
                {i === 0 && <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full"></div>}
              </div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-medium text-white/90 text-[15px] leading-tight">{step.name}</h3>
                <span className={`${step.color} text-[9px] font-mono uppercase tracking-wide shrink-0 text-right mt-0.5`}>{step.status}</span>
              </div>
              <p className="text-[13px] text-white/60 mb-5 leading-relaxed">{step.rationale}</p>
              <button className={`flex items-center gap-2 ${i === 0 ? 'text-[#00FF66]' : 'text-white/40'} text-[11px] font-mono uppercase tracking-wide active:opacity-70 p-1 -ml-1`}>
                <ExternalLink className="w-3 h-3" /> {step.link}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

const ExpandedFallbackView = ({ item, onBack, onHome }: any) => (
  <div className="fixed inset-0 bg-[#000000] z-[60] flex flex-col animate-slide-up">
    <div className="px-4 pt-6 pb-4 border-b border-white/10 bg-[#111111]/80 backdrop-blur-xl">
      <Breadcrumb onHome={onHome} onBack={onBack} title={item.name} />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-5">
        <Maximize2 className="w-6 h-6 text-white/20" />
      </div>
      <h2 className="font-outfit text-[20px] font-medium text-white/90 mb-3">{item.name}</h2>
      <p className="text-[13px] text-white/50 leading-relaxed max-w-[250px]">Detailed interactive visual view would render here.</p>
    </div>
  </div>
);

const TrajectoryView = ({ onBack, onHome }: any) => (
  <div className="fixed inset-0 bg-[#000000] z-[60] flex flex-col animate-slide-up">
    <div className="px-4 pt-6 pb-4 border-b border-white/10 bg-[#111111]/80 backdrop-blur-xl">
      <Breadcrumb onHome={onHome} onBack={onBack} title="Revenue Trajectory" />
    </div>
    
    <div className="flex-1 p-5 overflow-y-auto pb-12">
      <h2 className="font-outfit text-[24px] font-medium text-white/90 mb-8">Now to Summer '27</h2>
      
      <div className="space-y-8 relative before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-white/10">
        
        <div className="relative pl-8">
          <div className="absolute left-[7px] top-1.5 w-2.5 h-2.5 rounded-full bg-white/20"></div>
          <div className="text-[10px] font-mono text-white/40 mb-1 tracking-widest uppercase">Now (Q3 '26)</div>
          <div className="text-[18px] text-white/90 font-medium mb-1">~$400 / wk</div>
          <div className="text-[13px] text-white/50 leading-relaxed">Saturday farmers market only. Maxed out physical hours.</div>
        </div>

        <div className="relative pl-8">
          <div className="absolute left-[7px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#FFB800] shadow-[0_0_8px_rgba(255,184,0,0.5)]"></div>
          <div className="text-[10px] font-mono text-[#FFB800]/70 mb-1 tracking-widest uppercase">Q4 '26</div>
          <div className="text-[18px] text-white/90 font-medium mb-1">~$1,000 / wk</div>
          <div className="text-[13px] text-white/50 leading-relaxed">3 wholesale accounts active. Kitchen lease signed.</div>
        </div>

        <div className="relative pl-8">
          <div className="absolute left-[7px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.5)]"></div>
          <div className="text-[10px] font-mono text-[#00FF66]/70 mb-1 tracking-widest uppercase">Q1 '27</div>
          <div className="text-[18px] text-white/90 font-medium mb-1">~$1,600 / wk</div>
          <div className="text-[13px] text-white/50 leading-relaxed">6 wholesale accounts. Smooth weekly delivery cadence.</div>
        </div>

        <div className="relative pl-8">
          <div className="absolute left-[7px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#00CCFF] shadow-[0_0_8px_rgba(0,204,255,0.5)]"></div>
          <div className="text-[10px] font-mono text-[#00CCFF]/70 mb-1 tracking-widest uppercase">Summer '27</div>
          <div className="text-[24px] text-[#00CCFF] font-medium mb-1">~$2,400 / wk</div>
          <div className="text-[13px] text-white/50 leading-relaxed">10 accounts. Rent is fully covered by wholesale.</div>
        </div>

      </div>
    </div>
  </div>
);

const DetailView = ({ 
  item, 
  stackLength, 
  onBack, 
  onHome, 
  onPushRoute, 
  onVerdictClick 
}: any) => {
  const Visual = VISUALS[item.id];
  const chatHistory = CHAT_HISTORY[item.id] || [];
  const relatedIds = RELATED_MAP[item.id] || [];
  const [inputValue, setInputValue] = useState('');
  
  return (
    <div className="fixed inset-0 bg-[#000000] z-[50] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-white/10 bg-[#111111]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={stackLength > 2 ? onBack : undefined} title={item.name} />
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6">
        <div className="mb-5">
          <VerdictStamp verdict={item.verdict} onClick={onVerdictClick} />
          <p className="font-mono text-[9px] text-white/40 uppercase tracking-wide mt-3">
            {item.metrics.split('·')[0].trim()} <span className="mx-0.5 opacity-50">·</span> {item.metrics.split('·')[1].trim()}
          </p>
        </div>
        
        <button 
          onClick={() => onPushRoute({ type: 'expanded-visual', id: item.id })}
          className="w-full text-left bg-[#111111] border border-white/10 rounded-2xl p-5 mb-8 active:scale-[0.98] transition-transform shadow-sm relative overflow-hidden"
        >
          {Visual && <Visual />}
          <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-white/30 text-[10px] font-mono uppercase tracking-widest">
            <Maximize2 className="w-3 h-3" /> Tap to expand
          </div>
        </button>
        
        {chatHistory.length > 0 && (
          <div className="space-y-4 mb-8">
            {chatHistory.map((msg: any, idx: number) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-sm bg-white/30"></div>
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-white/10 text-white/90' 
                    : 'bg-[#111111] border border-white/10 text-white/80'
                }`}>
                  <p className="text-[14px] leading-relaxed font-outfit">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {chatHistory.length === 0 && (
          <div className="text-center py-8 text-white/30 text-[13px] font-outfit mb-8">
            No conversation yet
          </div>
        )}

        {relatedIds.length > 0 && (
          <div className="mt-8 mb-32 border-t border-white/10 pt-6">
            <div className="font-mono text-[9px] uppercase tracking-widest text-white/40 font-bold mb-4">Related Pins</div>
            <div className="flex flex-wrap gap-2">
              {relatedIds.map((rid: string) => {
                const rItem = ITEMS.find(i => i.id === rid);
                if (!rItem) return null;
                return (
                  <button 
                    key={rid}
                    onClick={() => onPushRoute({ type: 'pin', id: rid })}
                    className="flex items-center gap-2 px-3 py-2 bg-[#111111] hover:bg-white/10 border border-white/10 rounded-xl transition-colors active:scale-95"
                  >
                    <span className="text-[12px] text-white/80 font-outfit truncate max-w-[150px]">{rItem.name}</span>
                    <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent pointer-events-none pb-6 z-10">
        <div className="bg-[#1A1A1A]/90 border border-white/10 rounded-full p-1.5 pl-3 flex items-center gap-2 pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all focus-within:border-white/30 focus-within:bg-[#222]/90">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full shrink-0 max-w-[120px]">
            <span className="text-[11px] text-white/50 font-outfit truncate">{item.name.split(' ')[0]}</span>
            <button onClick={onHome} className="text-white/30 hover:text-white/60 p-0.5 active:scale-95">
              <X className="w-3 h-3" />
            </button>
          </div>
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this..." 
            className="flex-1 bg-transparent border-none outline-none text-white font-outfit text-[14px] placeholder-white/30 min-w-0"
          />
          <button className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 hover:bg-[#00FF66] transition-colors active:scale-95">
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

type RouteNode = 
  | { type: 'board' }
  | { type: 'pin', id: string }
  | { type: 'expanded-visual', id: string }
  | { type: 'trajectory' };

export default function PinboardV2() {
  const [navStack, setNavStack] = useState<RouteNode[]>([{ type: 'board' }]);
  const [toast, setToast] = useState<{title: string, desc: string} | null>(null);
  const [showAddHint, setShowAddHint] = useState(false);
  
  const pushRoute = (route: RouteNode) => setNavStack(prev => [...prev, route]);
  const popRoute = () => setNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  const goHome = () => setNavStack([{ type: 'board' }]);

  const handleVerdictClick = (e: React.MouseEvent, verdict: string) => {
    e.preventDefault();
    e.stopPropagation();
    setToast({ title: verdict, desc: VERDICT_EXPLANATIONS[verdict] });
    setTimeout(() => setToast(null), 4000);
  };
  
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
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
      `}</style>
      
      {/* Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-up w-[90%] max-w-[340px]">
          <div className="bg-[#1A1A1A] border border-white/20 rounded-xl px-4 py-3 shadow-2xl flex flex-col gap-1 w-full relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20"></div>
            <span className="text-[10px] font-mono font-bold text-white/50 ml-1">{toast.title}</span>
            <span className="text-[13px] text-white/90 font-outfit ml-1">{toast.desc}</span>
          </div>
        </div>
      )}

      {/* Base Board Layer */}
      <div className="w-full max-w-[390px] min-h-screen relative flex flex-col no-scrollbar overflow-y-auto">
        <PinnedSection onPushRoute={pushRoute} />
        
        <div className="px-4 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 items-start animate-fade-up delay-100">
            <BoardItem item={ITEMS[0]} onClick={() => pushRoute({ type: 'pin', id: ITEMS[0].id })} onVerdictClick={handleVerdictClick} />
            <BoardItem item={ITEMS[1]} onClick={() => pushRoute({ type: 'pin', id: ITEMS[1].id })} onVerdictClick={handleVerdictClick} />
          </div>
          
          <div className="animate-fade-up delay-200">
            <BeforeAfterCard onClick={() => pushRoute({ type: 'trajectory' })} />
          </div>
          
          <div className="grid grid-cols-2 gap-3 items-start animate-fade-up delay-300">
            <div className="flex flex-col gap-3">
              <BoardItem item={ITEMS[2]} onClick={() => pushRoute({ type: 'pin', id: ITEMS[2].id })} onVerdictClick={handleVerdictClick} />
              <BoardItem item={ITEMS[4]} onClick={() => pushRoute({ type: 'pin', id: ITEMS[4].id })} onVerdictClick={handleVerdictClick} />
            </div>
            <div className="flex flex-col gap-3">
              <BoardItem item={ITEMS[3]} onClick={() => pushRoute({ type: 'pin', id: ITEMS[3].id })} onVerdictClick={handleVerdictClick} />
              <BoardItem item={ITEMS[5]} onClick={() => pushRoute({ type: 'pin', id: ITEMS[5].id })} onVerdictClick={handleVerdictClick} />
            </div>
          </div>
          
          {/* Spacer for bottom bar */}
          <div className="h-28 w-full"></div>
        </div>

        {/* Input Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] p-4 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent pointer-events-none pb-6 z-40 animate-fade-up delay-400">
          <div className="flex items-end gap-2 pointer-events-auto">
            <div className="relative flex-1">
              <div className="bg-[#1A1A1A]/90 border border-white/10 rounded-full p-1.5 pl-5 flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all focus-within:border-white/30 focus-within:bg-[#222]/90">
                <input 
                  type="text" 
                  placeholder="Ask, or add a pin..." 
                  className="flex-1 bg-transparent border-none outline-none text-white font-outfit text-[14px] placeholder-white/30 min-w-0"
                />
                <button className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 hover:bg-[#00FF66] hover:text-black transition-colors active:scale-95">
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
              {showAddHint && (
                <div className="absolute bottom-full left-0 mb-2 bg-[#1A1A1A] border border-white/20 rounded-xl p-3 text-[12px] text-white/70 shadow-xl">
                  Type to add a new pin...
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowAddHint(!showAddHint)}
              className="w-11 h-11 rounded-full bg-[#111111] border border-white/20 text-white flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors active:scale-95 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Stack Layers */}
      {navStack.map((route, idx) => {
        if (idx === 0) return null; // Board is base layer
        
        if (route.type === 'pin') {
          const item = ITEMS.find(i => i.id === route.id);
          if (!item) return null;
          return <DetailView key={`pin-${idx}`} item={item} stackLength={navStack.length} onBack={popRoute} onHome={goHome} onPushRoute={pushRoute} onVerdictClick={handleVerdictClick} />;
        }
        
        if (route.type === 'expanded-visual') {
          const item = ITEMS.find(i => i.id === route.id);
          if (route.id === 'cakes') return <ExpandedCakesView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          if (route.id === 'kitchen') return <ExpandedKitchenView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          if (route.id === 'instagram') return <ExpandedInstagramView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          return <ExpandedFallbackView key={`exp-${idx}`} item={item} onBack={popRoute} onHome={goHome} />;
        }

        if (route.type === 'trajectory') {
          return <TrajectoryView key={`traj-${idx}`} onBack={popRoute} onHome={goHome} />;
        }
        
        return null;
      })}
    </div>
  );
}
