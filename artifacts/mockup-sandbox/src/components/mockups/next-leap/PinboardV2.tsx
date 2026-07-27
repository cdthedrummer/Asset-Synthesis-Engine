import React, { useState } from 'react';
import { ArrowUp, X, Plus, CheckCircle2, Coffee, Maximize2, ExternalLink, ChevronRight } from 'lucide-react';

const STYLE_GUIDE = {
  colors: {
    canvas: '#F9F8F6',
    surface: '#FFFFFF',
    text: {
      primary: '#1C1917',
      secondary: '#57534E',
      tertiary: '#A8A29E',
    },
    border: '#E7E5E4',
    divider: '#F5F5F4',
    verdict: {
      "START": { text: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
      "SCHEDULE": { text: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
      "GET HELP": { text: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      "SKIP FOR NOW": { text: '#BE123C', bg: '#FFF1F2', border: '#FECDD3' }
    }
  },
  radii: {
    card: '24px',
    pill: '999px'
  },
  shadows: {
    card: '0 8px 24px rgba(28, 25, 23, 0.04)',
    float: '0 12px 32px rgba(28, 25, 23, 0.08)',
    sm: '0 2px 8px rgba(28, 25, 23, 0.03)'
  }
};

const ITEMS = [
  { id: "cakes", name: "Custom cake orders", verdict: "SKIP FOR NOW", recency: "Just now" },
  { id: "wholesale", name: "Wholesale pitch", verdict: "START", recency: "Today" },
  { id: "cert", name: "Food-handler cert", verdict: "START", recency: "Yesterday" },
  { id: "kitchen", name: "Kitchen lease", verdict: "GET HELP", recency: "2 days ago" },
  { id: "website", name: "Website", verdict: "SCHEDULE", recency: "3 days ago" },
  { id: "instagram", name: "Content calendar", verdict: "SKIP FOR NOW", recency: "Last week" }
];

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
  ],
  wholesale: [
    { role: 'user', text: "Which cafes are we pitching?" },
    { role: 'ai', text: "Fern & Grounds takes samples Friday. Copper Cup is ready for the draft. Marigold comes after those two." }
  ],
  cert: [
    { role: 'user', text: "Booked the food handler cert." },
    { role: 'ai', text: "Good. Wednesday 7PM. It's a 20-minute test and it's step one for everything else." }
  ],
  kitchen: [
    { role: 'user', text: "Should I sign a commercial kitchen lease?" },
    { role: 'ai', text: "County requires the Food Handler Card first. Then Cottage Food Class B to verify home limits. Don't pay rent until two cafes say yes." }
  ],
  website: [
    { role: 'user', text: "I need to finish the homepage." },
    { role: 'ai', text: "A pitch needs a menu, not a homepage. Sourdough $9, Morning Buns $12, Seeded Rye $8, Galette $14. That's the artifact." }
  ],
  instagram: [
    { role: 'user', text: "I should build a content calendar." },
    { role: 'ai', text: "Posting more won't fix distribution. Saturday sell-out shot and Wednesday proofing timelapse is plenty for now." }
  ]
};

const CertVisual = () => (
  <div className="bg-[var(--color-text-primary)] text-white rounded-[16px] p-4 text-center mt-2 shadow-[var(--shadow-sm)] relative overflow-hidden min-w-0">
    <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
      <CheckCircle2 className="w-20 h-20" />
    </div>
    <div className="text-[28px] font-bold font-primary tracking-tight leading-none mb-1">7:00<span className="text-[14px] ml-1 opacity-70">PM</span></div>
    <div className="text-[10px] font-mono text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mb-4">Wednesday</div>
    <div className="inline-flex items-center gap-1.5 bg-[#10B981] text-white px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest shadow-md">
      <CheckCircle2 className="w-3 h-3 shrink-0" /> <span className="truncate">Booked</span>
    </div>
  </div>
);

const WholesaleVisual = () => (
  <div className="space-y-4 py-2 mt-2 w-full min-w-0">
    <div className="flex items-center gap-2.5 w-full min-w-0">
      <div className="w-9 h-9 rounded-[10px] bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
        <Coffee className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-primary)] text-[13px] font-bold truncate">Fern & Grounds</p>
        <p className="text-[#10B981] text-[9px] font-mono font-bold uppercase tracking-widest truncate mt-0.5">Samples Fri</p>
      </div>
    </div>
    <div className="flex items-center gap-2.5 w-full min-w-0">
      <div className="w-9 h-9 rounded-[10px] bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
        <Coffee className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-primary)] text-[13px] font-bold truncate">Copper Cup</p>
        <p className="text-[#D97706] text-[9px] font-mono font-bold uppercase tracking-widest truncate mt-0.5">Draft Ready</p>
      </div>
    </div>
    <div className="flex items-center gap-2.5 opacity-40 w-full min-w-0">
      <div className="w-9 h-9 rounded-[10px] bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
        <Coffee className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-primary)] text-[13px] font-bold truncate">Marigold</p>
        <p className="text-[var(--color-text-tertiary)] text-[9px] font-mono font-bold uppercase tracking-widest truncate mt-0.5">Not Started</p>
      </div>
    </div>
  </div>
);

const WebsiteVisual = () => (
  <div className="bg-[#FFFDFB] border border-[var(--color-border)] p-3 rounded-[16px] shadow-[var(--shadow-sm)] font-mono text-[11px] leading-relaxed mt-2 relative min-w-0">
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--color-surface)] px-2 text-[9px] font-bold text-[var(--color-text-tertiary)] tracking-widest uppercase">Menu</div>
    <div className="space-y-3 pt-1">
      <div className="flex justify-between items-baseline gap-1">
        <span className="text-[var(--color-text-primary)] font-bold truncate">Sourdough</span>
        <span className="border-b-2 border-dotted border-[var(--color-divider)] flex-1 mx-1 min-w-[8px]"></span>
        <span className="text-[var(--color-text-secondary)] font-bold shrink-0">$9</span>
      </div>
      <div className="flex justify-between items-baseline gap-1">
        <span className="text-[var(--color-text-primary)] font-bold truncate">Morn Buns (4)</span>
        <span className="border-b-2 border-dotted border-[var(--color-divider)] flex-1 mx-1 min-w-[8px]"></span>
        <span className="text-[var(--color-text-secondary)] font-bold shrink-0">$12</span>
      </div>
      <div className="flex justify-between items-baseline gap-1">
        <span className="text-[var(--color-text-primary)] font-bold truncate">Seeded Rye</span>
        <span className="border-b-2 border-dotted border-[var(--color-divider)] flex-1 mx-1 min-w-[8px]"></span>
        <span className="text-[var(--color-text-secondary)] font-bold shrink-0">$8</span>
      </div>
      <div className="flex justify-between items-baseline gap-1">
        <span className="text-[var(--color-text-primary)] font-bold truncate">Galette</span>
        <span className="border-b-2 border-dotted border-[var(--color-divider)] flex-1 mx-1 min-w-[8px]"></span>
        <span className="text-[var(--color-text-secondary)] font-bold shrink-0">$14</span>
      </div>
    </div>
  </div>
);

const KitchenVisual = () => (
  <div className="relative pl-6 space-y-6 py-3 before:absolute before:left-[9px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[var(--color-divider)] mt-1 min-w-0">
    <div className="relative min-w-0">
      <div className="absolute -left-[31px] top-[2px] w-3 h-3 bg-[#10B981] border-[3px] border-[var(--color-surface)] rounded-full"></div>
      <div className="text-[13px] font-bold text-[var(--color-text-primary)] leading-none font-primary tracking-tight truncate">Food Handler Card</div>
    </div>
    <div className="relative min-w-0">
      <div className="absolute -left-[31px] top-[2px] w-3 h-3 bg-[#D97706] border-[3px] border-[var(--color-surface)] rounded-full"></div>
      <div className="text-[13px] font-bold text-[var(--color-text-primary)] leading-none font-primary tracking-tight truncate">Cottage Food B</div>
    </div>
    <div className="relative opacity-40 min-w-0">
      <div className="absolute -left-[31px] top-[2px] w-3 h-3 bg-[var(--color-text-tertiary)] border-[3px] border-[var(--color-surface)] rounded-full"></div>
      <div className="text-[13px] font-bold text-[var(--color-text-primary)] leading-none font-primary tracking-tight truncate">Business License</div>
    </div>
    <div className="relative opacity-40 min-w-0">
      <div className="absolute -left-[31px] top-[2px] w-3 h-3 bg-[var(--color-text-tertiary)] border-[3px] border-[var(--color-surface)] rounded-full"></div>
      <div className="text-[13px] font-bold text-[var(--color-text-primary)] leading-none font-primary tracking-tight truncate">Kitchen Agreement</div>
    </div>
  </div>
);

const InstagramVisual = () => {
  return (
    <div className="py-2 mt-1">
      <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] font-bold">
        <div className="text-[var(--color-text-tertiary)] pb-1.5">S</div>
        <div className="text-[var(--color-text-tertiary)] pb-1.5">M</div>
        <div className="text-[var(--color-text-tertiary)] pb-1.5">T</div>
        <div className="text-[var(--color-text-tertiary)] pb-1.5">W</div>
        <div className="text-[var(--color-text-tertiary)] pb-1.5">T</div>
        <div className="text-[var(--color-text-tertiary)] pb-1.5">F</div>
        <div className="text-[var(--color-text-tertiary)] pb-1.5">S</div>
        
        <div className="bg-[var(--color-canvas)] rounded-[8px] aspect-square flex items-center justify-center text-[var(--color-text-tertiary)]">26</div>
        <div className="bg-[var(--color-canvas)] rounded-[8px] aspect-square flex items-center justify-center text-[var(--color-text-tertiary)]">27</div>
        <div className="bg-[var(--color-canvas)] rounded-[8px] aspect-square flex items-center justify-center text-[var(--color-text-tertiary)]">28</div>
        <div className="bg-[var(--color-text-primary)] text-white rounded-[8px] aspect-square flex flex-col items-center justify-center shadow-md relative">
          29
          <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full absolute bottom-1.5"></div>
        </div>
        <div className="bg-[var(--color-canvas)] rounded-[8px] aspect-square flex items-center justify-center text-[var(--color-text-tertiary)]">30</div>
        <div className="bg-[var(--color-canvas)] rounded-[8px] aspect-square flex items-center justify-center text-[var(--color-text-tertiary)]">31</div>
        <div className="bg-[#FFF1F2] text-[#E11D48] rounded-[8px] aspect-square flex flex-col items-center justify-center relative">
          1
          <div className="w-1.5 h-1.5 bg-[#E11D48] rounded-full absolute bottom-1.5"></div>
        </div>
      </div>
    </div>
  );
};

const CakesVisual = () => (
  <div className="py-2 mt-2">
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-3 h-20 w-full justify-center border-b-[2px] border-dashed border-[#BE123C] relative mb-1">
        <span className="absolute -top-3 right-0 text-[10px] font-mono text-[#BE123C] uppercase tracking-widest font-bold">Cap 2</span>
        <div className="w-10 bg-[#FECDD3] rounded-t-[10px]" style={{height: '40%'}}></div>
        <div className="w-10 bg-[#FECDD3] rounded-t-[10px]" style={{height: '70%'}}></div>
        <div className="w-10 bg-[#BE123C] shadow-lg rounded-t-[10px] relative -bottom-[2px] z-10" style={{height: '110%'}}></div>
      </div>
    </div>
  </div>
);

const VISUALS: Record<string, React.ComponentType> = {
  cert: CertVisual,
  wholesale: WholesaleVisual,
  website: WebsiteVisual,
  kitchen: KitchenVisual,
  instagram: InstagramVisual,
  cakes: CakesVisual
};

const VerdictStamp = ({ verdict, onClick }: { verdict: string, onClick: (e: React.MouseEvent, v: string) => void }) => {
  const style = STYLE_GUIDE.colors.verdict[verdict as keyof typeof STYLE_GUIDE.colors.verdict];
  return (
    <button 
      onClick={(e) => onClick(e, verdict)}
      className="inline-flex w-auto items-center px-1.5 py-1 rounded-[var(--radius-pill)] border font-mono text-[8px] uppercase tracking-[0.05em] font-bold active:scale-95 transition-transform relative z-10 shrink-0 whitespace-nowrap"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border
      }}
    >
      <span>{verdict}</span>
    </button>
  );
};

const BoardItem = ({ item, onClick, onVerdictClick }: { item: typeof ITEMS[0], onClick: () => void, onVerdictClick: (e: React.MouseEvent, v: string) => void }) => {
  const Visual = VISUALS[item.id];
  
  return (
    <div 
      onClick={onClick}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-3.5 flex flex-col shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] transition-all text-left active:scale-[0.98] cursor-pointer break-inside-avoid w-full min-w-0"
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="min-w-0 shrink">
          <VerdictStamp verdict={item.verdict} onClick={onVerdictClick} />
        </div>
        <span className="text-[9px] font-mono font-bold text-[var(--color-text-tertiary)] uppercase mt-1 shrink-0">{item.recency}</span>
      </div>
      {Visual && <Visual />}
    </div>
  );
};

const TrajectoryCard = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left bg-[var(--color-surface)] rounded-[24px] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border)] active:scale-[0.98] transition-transform overflow-hidden relative block min-w-0">
    <div className="flex justify-between items-end mb-2 gap-2">
      <div className="font-primary text-[20px] font-bold text-[var(--color-text-primary)] leading-none truncate">Summer '27</div>
      <div className="font-primary text-[26px] font-bold text-[#10B981] leading-none shrink-0">~$2,400<span className="text-[14px] text-[var(--color-text-secondary)] font-medium">/wk</span></div>
    </div>
    
    <div className="h-[120px] w-full relative mt-4">
      <svg viewBox="0 0 350 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 0,95 L 70,85 L 161,62 L 255,40 L 350,12 L 350,100 L 0,100 Z" fill="url(#chartFill)" />
        <path d="M 0,95 L 70,85" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 70,85 L 161,62 L 255,40 L 350,12" stroke="#10B981" strokeWidth="3" strokeDasharray="5,5" fill="none" strokeLinecap="round" />
        
        <circle cx="70" cy="85" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
        <circle cx="161" cy="62" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
        <circle cx="255" cy="40" r="4.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
        <circle cx="350" cy="12" r="5" fill="#10B981" />
      </svg>
    </div>
    
    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-[var(--color-text-tertiary)] text-[10px] font-mono uppercase tracking-widest font-bold">
      <Maximize2 className="w-3 h-3" /> Tap to expand
    </div>
  </button>
);

const HowWeGotHere = () => (
  <div className="flex gap-2">
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] p-3 flex-1 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center min-w-0">
      <div className="text-[20px] font-bold text-[var(--color-text-primary)] font-primary leading-none mb-1.5 truncate w-full text-center">52/52</div>
      <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-[var(--color-text-tertiary)] font-bold text-center truncate w-full">Sat Sold Out</div>
    </div>
    <div className="bg-[#ECFDF5] border border-[#BBF7D0] rounded-[20px] p-3 flex-1 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center min-w-0">
      <div className="text-[20px] font-bold text-[#10B981] font-primary leading-none mb-1.5 truncate w-full text-center">$2k</div>
      <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-[#10B981] font-bold text-center opacity-80 truncate w-full">Investable</div>
    </div>
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] p-3 flex-1 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center min-w-0">
      <div className="text-[20px] font-bold text-[var(--color-text-primary)] font-primary leading-none mb-1.5 truncate w-full text-center">10</div>
      <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-[var(--color-text-tertiary)] font-bold text-center truncate w-full">Hrs / Wk</div>
    </div>
  </div>
);

const Breadcrumb = ({ onHome, onBack, title }: { onHome: () => void, onBack?: () => void, title: string }) => (
  <div className="flex items-center gap-1.5 text-[14px] font-primary font-medium">
    <button onClick={onHome} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] py-2 pr-2 active:scale-95 transition-colors">Board</button>
    <span className="text-[var(--color-border)] shrink-0">/</span>
    {onBack && (
      <>
        <button onClick={onBack} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] px-2 py-2 active:scale-95 transition-colors">Back</button>
        <span className="text-[var(--color-border)] shrink-0">/</span>
      </>
    )}
    <span className="text-[var(--color-text-primary)] pl-1 truncate flex-1 font-bold">{title}</span>
  </div>
);

const ExpandedCakesView = ({ onBack, onHome }: any) => {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const orders = [3, 4, 5, 6, 8, 9];
  const revenues = orders.map(o => o * 180);
  const maxRev = 1620;
  const capRev = 360;

  return (
    <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title="Cake Orders" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-12 pt-8">
        <div className="space-y-6">
          {months.map((m, i) => (
            <div key={m} className="flex items-center gap-4">
              <div className="w-8 text-[11px] font-mono font-bold text-[var(--color-text-tertiary)] text-right shrink-0">{m}</div>
              <div className="flex-1 h-8 relative bg-[var(--color-surface)] rounded-[8px] border border-[var(--color-border)] overflow-hidden shadow-sm">
                <div className="absolute inset-y-0 left-0 bg-[#FECDD3] flex items-center justify-end pr-2" style={{ width: `${(revenues[i] / maxRev) * 100}%` }}>
                  <span className="text-[10px] font-mono font-bold text-[#BE123C]">${revenues[i]}</span>
                </div>
                {revenues[i] > capRev && (
                  <div className="absolute inset-y-0 left-0 bg-[#BE123C] border-r border-[#BE123C] flex items-center px-2" style={{ width: `${(capRev / maxRev) * 100}%` }}>
                    <span className="text-[10px] font-mono font-bold text-white">${capRev}</span>
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
    <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title="Content Calendar" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-12 pt-8">
        <div className="grid grid-cols-7 gap-2 mb-3 text-center text-[10px] font-mono text-[var(--color-text-tertiary)] font-bold uppercase">
          <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-10">
          <div className="col-span-6"></div>
          {days.map(d => (
            <div key={d} className={`aspect-square rounded-[12px] flex flex-col items-center justify-center relative ${posts[d] ? 'bg-[var(--color-text-primary)] text-white shadow-md' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]'}`}>
              <span className={`text-[12px] font-mono ${posts[d] ? 'font-bold' : ''}`}>{d}</span>
              {posts[d] && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${posts[d].type === 'video' ? 'bg-[#10B981]' : 'bg-[#E11D48]'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

const ExpandedKitchenView = ({ onBack, onHome }: any) => {
  const steps = [
    { name: "Food Handler Card", status: "BOOKING NOW", color: "text-[#10B981]", bg: "bg-[#ECFDF5]", link: "County Health Portal" },
    { name: "Cottage Food Class B", status: "VERIFY YOURSELF", color: "text-[#D97706]", bg: "bg-[#FFFBEB]", link: "Class B Requirements" },
    { name: "Business License", status: "30 MIN ONLINE", color: "text-[var(--color-text-tertiary)]", bg: "bg-[var(--color-surface)]", link: "City Clerk Site" },
    { name: "Kitchen Agreement", status: "AFTER CAFÉS", color: "text-[var(--color-text-tertiary)]", bg: "bg-[var(--color-surface)]", link: "Review Lease Template" }
  ];

  return (
    <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title="Kitchen Permits" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-12 pt-8">
        <div className="space-y-6 relative before:absolute before:inset-y-4 before:left-[19px] before:w-[2px] before:bg-[var(--color-border)]">
          {steps.map((step, i) => (
            <div key={i} className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] p-5 ml-11 relative shadow-[var(--shadow-sm)] min-w-0`}>
              <div className="absolute top-6 -left-[35px] w-[16px] h-[16px] rounded-full bg-white border-[4px] border-[var(--color-border)] z-10 flex items-center justify-center">
                {i === 0 && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
              </div>
              <div className="flex flex-col gap-2 mb-4 min-w-0">
                <span className={`${step.color} ${step.bg} px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest self-start truncate max-w-full`}>{step.status}</span>
                <h3 className="font-bold text-[var(--color-text-primary)] text-[18px] leading-tight font-primary truncate max-w-full">{step.name}</h3>
              </div>
              <button className={`flex items-center gap-2 ${i === 0 ? 'text-[#10B981]' : 'text-[var(--color-text-tertiary)]'} text-[12px] font-mono font-bold uppercase tracking-widest active:opacity-70 transition-opacity min-w-0 max-w-full`}>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{step.link}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

const ExpandedWholesaleView = ({ onBack, onHome }: any) => (
  <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
    <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
      <Breadcrumb onHome={onHome} onBack={onBack} title="Wholesale Pitch" />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-[280px] transform scale-125 origin-center">
        <WholesaleVisual />
      </div>
    </div>
  </div>
);

const ExpandedCertView = ({ onBack, onHome }: any) => (
  <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
    <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
      <Breadcrumb onHome={onHome} onBack={onBack} title="Food Handler Cert" />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-[280px] transform scale-110 origin-center">
        <CertVisual />
      </div>
    </div>
  </div>
);

const ExpandedWebsiteView = ({ onBack, onHome }: any) => (
  <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
    <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
      <Breadcrumb onHome={onHome} onBack={onBack} title="Website Menu" />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-[280px] transform scale-125 origin-center">
        <WebsiteVisual />
      </div>
    </div>
  </div>
);

const TrajectoryView = ({ onBack, onHome }: any) => (
  <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
    <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
      <Breadcrumb onHome={onHome} onBack={onBack} title="Trajectory" />
    </div>
    
    <div className="flex-1 p-6 overflow-y-auto pb-12 pt-8">
      <div className="w-full h-44 mb-12 relative">
        <svg viewBox="0 0 350 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartFillLarge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 0,110 L 70,90 L 161,65 L 255,40 L 350,10 L 350,120 L 0,120 Z" fill="url(#chartFillLarge)" />
          <path d="M 0,110 L 70,90" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 70,90 L 161,65 L 255,40 L 350,10" stroke="#10B981" strokeWidth="3" strokeDasharray="5,5" fill="none" strokeLinecap="round" />
          
          <circle cx="70" cy="90" r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
          <circle cx="161" cy="65" r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
          <circle cx="255" cy="40" r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
          <circle cx="350" cy="10" r="5" fill="#10B981" />
        </svg>
      </div>

      <div className="space-y-8 relative before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-[var(--color-border)]">
        <div className="relative pl-10">
          <div className="absolute left-[6.5px] top-1 w-[11px] h-[11px] rounded-full bg-white border-2 border-[#10B981]"></div>
          <div className="text-[11px] font-mono font-bold text-[var(--color-text-tertiary)] mb-1 tracking-widest uppercase">Now (Q3 '26)</div>
          <div className="text-[20px] text-[var(--color-text-primary)] font-bold font-primary">~$400 / wk</div>
        </div>

        <div className="relative pl-10">
          <div className="absolute left-[6.5px] top-1 w-[11px] h-[11px] rounded-full bg-white border-2 border-[#10B981]"></div>
          <div className="text-[11px] font-mono font-bold text-[var(--color-text-tertiary)] mb-1 tracking-widest uppercase">Q4 '26</div>
          <div className="text-[20px] text-[var(--color-text-primary)] font-bold font-primary">~$1,000 / wk</div>
        </div>

        <div className="relative pl-10">
          <div className="absolute left-[6.5px] top-1 w-[11px] h-[11px] rounded-full bg-white border-2 border-[#10B981]"></div>
          <div className="text-[11px] font-mono font-bold text-[var(--color-text-tertiary)] mb-1 tracking-widest uppercase">Q1 '27</div>
          <div className="text-[20px] text-[var(--color-text-primary)] font-bold font-primary">~$1,600 / wk</div>
        </div>

        <div className="relative pl-10">
          <div className="absolute left-[5.5px] top-0.5 w-[13px] h-[13px] rounded-full bg-[#10B981] border-2 border-white shadow-sm"></div>
          <div className="text-[11px] font-mono font-bold text-[#10B981] mb-1 tracking-widest uppercase">Summer '27</div>
          <div className="text-[28px] text-[var(--color-text-primary)] font-bold font-primary">~$2,400 / wk</div>
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
    <div className="fixed inset-0 bg-[var(--color-canvas)] z-[50] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={stackLength > 2 ? onBack : undefined} title={item.name} />
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        <div className="flex justify-between items-start mb-6 gap-2">
          <div className="min-w-0 shrink">
            <VerdictStamp verdict={item.verdict} onClick={onVerdictClick} />
          </div>
          <span className="text-[10px] font-mono font-bold text-[var(--color-text-tertiary)] uppercase mt-1 shrink-0">{item.recency}</span>
        </div>
        
        <button 
          onClick={() => onPushRoute({ type: 'expanded-visual', id: item.id })}
          className="w-full text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[24px] p-6 mb-8 active:scale-[0.98] transition-transform shadow-[var(--shadow-sm)] relative overflow-hidden block min-w-0"
        >
          {Visual && <Visual />}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-center gap-2 text-[var(--color-text-tertiary)] text-[10px] font-mono uppercase tracking-widest font-bold">
            <Maximize2 className="w-3 h-3" /> Tap to expand
          </div>
        </button>
        
        {chatHistory.length > 0 && (
          <div className="space-y-4 mb-8">
            {chatHistory.map((msg: any, idx: number) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[var(--color-text-tertiary)]"></div>
                  </div>
                )}
                <div className={`max-w-[85%] px-4.5 py-3.5 rounded-[20px] shadow-[var(--shadow-sm)] ${
                  msg.role === 'user' 
                    ? 'bg-[var(--color-text-primary)] text-white' 
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                }`}>
                  <p className="text-[14px] leading-relaxed font-primary font-medium">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {relatedIds.length > 0 && (
          <div className="mt-10 mb-32 border-t border-[var(--color-border)] pt-8">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold mb-4">Related Pins</div>
            <div className="flex flex-wrap gap-2">
              {relatedIds.map((rid: string) => {
                const rItem = ITEMS.find(i => i.id === rid);
                if (!rItem) return null;
                return (
                  <button 
                    key={rid}
                    onClick={() => onPushRoute({ type: 'pin', id: rid })}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:shadow-md border border-[var(--color-border)] rounded-[16px] transition-shadow active:scale-95"
                  >
                    <span className="text-[13px] text-[var(--color-text-secondary)] font-primary font-semibold truncate max-w-[150px]">{rItem.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-canvas)] via-[var(--color-canvas)] to-transparent pb-6 z-10 pointer-events-none">
        <div className="bg-white/80 border border-[var(--color-border)] rounded-full p-2 pl-3 flex items-center gap-2 shadow-[var(--shadow-float)] backdrop-blur-xl transition-all focus-within:border-[var(--color-text-tertiary)] focus-within:bg-white pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-full shrink-0 max-w-[140px]">
            <span className="text-[12px] text-[var(--color-text-secondary)] font-primary font-semibold truncate">{item.name.split(' ')[0]}</span>
            <button onClick={onHome} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-0.5 active:scale-95 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this..." 
            className="flex-1 bg-transparent border-none outline-none text-[var(--color-text-primary)] font-primary font-semibold text-[15px] placeholder-[var(--color-text-tertiary)] min-w-0"
          />
          <button className="w-10 h-10 rounded-full bg-[var(--color-text-primary)] text-white flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95">
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
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

  const col1 = ITEMS.filter((_, i) => i % 2 === 0);
  const col2 = ITEMS.filter((_, i) => i % 2 === 1);
  
  return (
    <div className="w-full min-h-screen relative font-sans flex justify-center overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text-primary)]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        
        :root {
          --color-canvas: ${STYLE_GUIDE.colors.canvas};
          --color-surface: ${STYLE_GUIDE.colors.surface};
          --color-text-primary: ${STYLE_GUIDE.colors.text.primary};
          --color-text-secondary: ${STYLE_GUIDE.colors.text.secondary};
          --color-text-tertiary: ${STYLE_GUIDE.colors.text.tertiary};
          --color-border: ${STYLE_GUIDE.colors.border};
          --color-divider: ${STYLE_GUIDE.colors.divider};
          
          --radius-card: ${STYLE_GUIDE.radii.card};
          --radius-pill: ${STYLE_GUIDE.radii.pill};
          
          --shadow-card: ${STYLE_GUIDE.shadows.card};
          --shadow-float: ${STYLE_GUIDE.shadows.float};
          --shadow-sm: ${STYLE_GUIDE.shadows.sm};
        }
        
        .font-primary { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
      `}</style>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-up w-[90%] max-w-[340px]">
          <div className="bg-white border border-[var(--color-border)] rounded-[20px] px-4 py-3.5 shadow-[var(--shadow-float)] flex flex-col gap-1 w-full relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[6px]" style={{ backgroundColor: STYLE_GUIDE.colors.verdict[toast.title as keyof typeof STYLE_GUIDE.colors.verdict].text }}></div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: STYLE_GUIDE.colors.verdict[toast.title as keyof typeof STYLE_GUIDE.colors.verdict].text }}>{toast.title}</span>
            <span className="text-[14px] text-[var(--color-text-secondary)] font-primary font-bold ml-0.5">{toast.desc}</span>
          </div>
        </div>
      )}

      {/* Base Board Layer */}
      <div className="w-full max-w-[390px] min-h-screen relative flex flex-col no-scrollbar overflow-y-auto">
        <div className="px-4 py-6 space-y-5">
          <div className="animate-fade-up delay-100">
            <HowWeGotHere />
          </div>
          
          <div className="animate-fade-up delay-200">
            <TrajectoryCard onClick={() => pushRoute({ type: 'trajectory' })} />
          </div>
          
          <div className="flex items-start gap-3 animate-fade-up delay-300">
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {col1.map((item) => (
                <BoardItem key={item.id} item={item} onClick={() => pushRoute({ type: 'pin', id: item.id })} onVerdictClick={handleVerdictClick} />
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {col2.map((item) => (
                <BoardItem key={item.id} item={item} onClick={() => pushRoute({ type: 'pin', id: item.id })} onVerdictClick={handleVerdictClick} />
              ))}
            </div>
          </div>
          
          <div className="h-28 w-full"></div>
        </div>

        {/* Input Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] p-4 bg-gradient-to-t from-[var(--color-canvas)] via-[var(--color-canvas)] to-transparent pointer-events-none pb-6 z-40 animate-fade-up delay-400">
          <div className="flex items-end gap-3 pointer-events-auto">
            <div className="relative flex-1">
              <div className="bg-white/80 border border-[var(--color-border)] rounded-full p-2 pl-5 flex items-center gap-3 shadow-[var(--shadow-float)] backdrop-blur-xl transition-all focus-within:border-[var(--color-text-tertiary)] focus-within:bg-white">
                <input 
                  type="text" 
                  placeholder="Ask, or add a pin..." 
                  className="flex-1 bg-transparent border-none outline-none text-[var(--color-text-primary)] font-primary font-semibold text-[15px] placeholder-[var(--color-text-tertiary)] min-w-0"
                />
                <button className="w-10 h-10 rounded-full bg-[var(--color-text-primary)] text-white flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95">
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
              {showAddHint && (
                <div className="absolute bottom-full left-0 mb-3 bg-white border border-[var(--color-border)] rounded-[20px] p-4 text-[13px] font-primary font-bold text-[var(--color-text-secondary)] shadow-[var(--shadow-float)] animate-fade-up">
                  Type to add a new pin...
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowAddHint(!showAddHint)}
              className="w-[56px] h-[56px] rounded-full bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center flex-shrink-0 hover:bg-gray-50 transition-colors active:scale-95 shadow-[var(--shadow-float)]"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Stack Layers */}
      {navStack.map((route, idx) => {
        if (idx === 0) return null;
        
        if (route.type === 'pin') {
          const item = ITEMS.find(i => i.id === route.id);
          if (!item) return null;
          return <DetailView key={`pin-${idx}`} item={item} stackLength={navStack.length} onBack={popRoute} onHome={goHome} onPushRoute={pushRoute} onVerdictClick={handleVerdictClick} />;
        }
        
        if (route.type === 'expanded-visual') {
          if (route.id === 'cakes') return <ExpandedCakesView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          if (route.id === 'kitchen') return <ExpandedKitchenView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          if (route.id === 'instagram') return <ExpandedInstagramView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          if (route.id === 'wholesale') return <ExpandedWholesaleView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          if (route.id === 'cert') return <ExpandedCertView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          if (route.id === 'website') return <ExpandedWebsiteView key={`exp-${idx}`} onBack={popRoute} onHome={goHome} />;
          return null;
        }

        if (route.type === 'trajectory') {
          return <TrajectoryView key={`traj-${idx}`} onBack={popRoute} onHome={goHome} />;
        }
        
        return null;
      })}
    </div>
  );
}
