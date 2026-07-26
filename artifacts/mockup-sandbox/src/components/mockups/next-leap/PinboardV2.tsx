import React, { useState } from 'react';
import { ArrowUp, X, Plus, ArrowLeft, ChevronRight, Maximize2, ExternalLink } from 'lucide-react';

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
  {
    id: "cert",
    name: "Food-handler certification",
    metrics: "Easy · High impact",
    verdict: "START"
  },
  {
    id: "wholesale",
    name: "Wholesale pitch: three local cafés",
    metrics: "Medium · High impact",
    verdict: "START"
  },
  {
    id: "website",
    name: "Finish the website",
    metrics: "Med · Med impact",
    verdict: "SCHEDULE"
  },
  {
    id: "kitchen",
    name: "Commercial kitchen lease",
    metrics: "Hard · High impact",
    verdict: "GET HELP"
  },
  {
    id: "instagram",
    name: "Instagram content calendar",
    metrics: "Easy · Low impact",
    verdict: "SKIP FOR NOW"
  },
  {
    id: "cakes",
    name: "Custom cake orders",
    metrics: "Med · Low impact",
    verdict: "SKIP FOR NOW"
  }
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
  ]
};

const CertVisual = () => (
  <div className="space-y-3 py-1">
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-[var(--color-text-primary)] flex items-center justify-center text-white font-mono text-[11px] font-bold shrink-0 shadow-sm">1</div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-primary)] text-[13px] font-semibold leading-tight mb-0.5 truncate">Book exam</p>
        <p className="text-[var(--color-text-tertiary)] text-[10px] font-mono truncate">Tonight, 20 min</p>
      </div>
    </div>
    <div className="flex items-center gap-3 opacity-60">
      <div className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)] font-mono text-[11px] font-bold shrink-0 bg-[var(--color-canvas)]">2</div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-secondary)] text-[13px] font-medium leading-tight mb-0.5 truncate">Take exam</p>
        <p className="text-[var(--color-text-tertiary)] text-[10px] font-mono truncate">This week</p>
      </div>
    </div>
    <div className="flex items-center gap-3 opacity-40">
      <div className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)] font-mono text-[11px] font-bold shrink-0 bg-[var(--color-canvas)]">3</div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-secondary)] text-[13px] font-medium leading-tight mb-0.5 truncate">Certified</p>
        <p className="text-[var(--color-text-tertiary)] text-[10px] font-mono truncate">Unlocks wholesale</p>
      </div>
    </div>
  </div>
);

const WholesaleVisual = () => (
  <div className="space-y-2.5 py-1">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)] shrink-0"></div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-primary)] text-[13px] font-semibold truncate">Fern & Grounds</p>
        <p className="text-[var(--color-text-tertiary)] text-[10px] font-mono truncate">Samples Friday</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0"></div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-secondary)] text-[13px] font-medium truncate">Copper Cup</p>
        <p className="text-[var(--color-text-tertiary)] text-[10px] font-mono truncate">Draft ready</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full border-2 border-[var(--color-border)] shrink-0"></div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-tertiary)] text-[13px] font-medium truncate">Marigold Coffee</p>
        <p className="text-[var(--color-divider)] text-[10px] font-mono truncate">Not started</p>
      </div>
    </div>
  </div>
);

const WebsiteVisual = () => (
  <div className="bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-xl p-3 mt-1 shadow-inner">
    <h4 className="text-[var(--color-text-secondary)] text-[11px] font-bold mb-2.5 font-mono tracking-widest uppercase">Saturday Menu</h4>
    <div className="space-y-2">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[var(--color-text-primary)] text-[12px] font-medium truncate">Sourdough Loaf</span>
        <span className="text-[var(--color-text-tertiary)] text-[11px] font-mono shrink-0">$9</span>
      </div>
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[var(--color-text-primary)] text-[12px] font-medium truncate">Morning Buns (4)</span>
        <span className="text-[var(--color-text-tertiary)] text-[11px] font-mono shrink-0">$12</span>
      </div>
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[var(--color-text-primary)] text-[12px] font-medium truncate">Seeded Rye</span>
        <span className="text-[var(--color-text-tertiary)] text-[11px] font-mono shrink-0">$8</span>
      </div>
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[var(--color-text-primary)] text-[12px] font-medium truncate">Galette</span>
        <span className="text-[var(--color-text-tertiary)] text-[11px] font-mono shrink-0">$14</span>
      </div>
    </div>
  </div>
);

const KitchenVisual = () => (
  <div className="space-y-1.5 py-1 text-[11px]">
    <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--color-border)]">
      <div className="flex-[2] text-[var(--color-text-tertiary)] font-mono text-[9px] uppercase tracking-widest">Permit</div>
      <div className="flex-1 text-[var(--color-text-tertiary)] font-mono text-[9px] uppercase tracking-widest text-right">Status</div>
    </div>
    <div className="flex items-center gap-1.5 py-1">
      <div className="flex-[2] text-[var(--color-text-primary)] font-medium text-[11px] truncate">Food Handler Card</div>
      <div className="flex-1 text-[#10B981] text-[10px] font-medium text-right truncate">booking</div>
    </div>
    <div className="flex items-center gap-1.5 py-1 bg-[#FFFBEB] -mx-2 px-2 rounded">
      <div className="flex-[2] text-[#D97706] font-medium text-[11px] truncate">Cottage Food B</div>
      <div className="flex-1 text-[#D97706] text-[10px] font-medium underline decoration-dotted text-right truncate">verify</div>
    </div>
    <div className="flex items-center gap-1.5 py-1">
      <div className="flex-[2] text-[var(--color-text-secondary)] font-medium text-[11px] truncate">Business License</div>
      <div className="flex-1 text-[var(--color-text-tertiary)] text-[10px] text-right truncate">30 min</div>
    </div>
  </div>
);

const InstagramVisual = () => {
  const dates = ['Jul 26', 'Jul 27', 'Jul 28', 'Jul 29'];
  const posts = [0, -1, 3, -1];
  
  return (
    <div className="py-1">
      <div className="flex items-center justify-between mb-3 w-full">
        {dates.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${posts[i] === 0 ? 'bg-[#FFF1F2] text-[#E11D48]' : posts[i] === 3 ? 'bg-[var(--color-text-primary)] text-white shadow-md' : 'bg-[var(--color-canvas)] text-[var(--color-text-tertiary)] border border-[var(--color-border)]'}`}>
              {posts[i] >= 0 ? '●' : ''}
            </div>
            <span className="text-[var(--color-text-tertiary)] text-[9px] font-mono">{d.split(' ')[1]}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-[11px]">
        <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E11D48] shrink-0"></div>
          <span className="truncate">Sat: sell-out shot</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)] shrink-0"></div>
          <span className="truncate">Wed: proofing timelapse</span>
        </div>
      </div>
    </div>
  );
};

const CakesVisual = () => {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const orders = [4, 5, 6, 8, 9];
  const max = 10;
  const cap = 2;
  
  return (
    <div className="py-1">
      <div className="flex items-end justify-between h-20 mb-2">
        {orders.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full px-1">
              <div className="relative w-full bg-[var(--color-canvas)] rounded-t-sm overflow-hidden" style={{ height: `${(val / max) * 100}%` }}>
                <div className="absolute top-0 left-0 right-0 bg-[#FECDD3]" style={{ height: `${((val - cap) / val) * 100}%` }}></div>
                <div className="absolute bottom-0 left-0 right-0 bg-[#BE123C]" style={{ height: `${(cap / val) * 100}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-1">
        {months.map((m, i) => (
          <span key={i} className="text-[var(--color-text-tertiary)] text-[9px] font-mono flex-1 text-center">{m}</span>
        ))}
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

const VerdictStamp = ({ verdict, onClick }: { verdict: string, onClick: (e: React.MouseEvent, v: string) => void }) => {
  const style = STYLE_GUIDE.colors.verdict[verdict as keyof typeof STYLE_GUIDE.colors.verdict];
  return (
    <button 
      onClick={(e) => onClick(e, verdict)}
      className="inline-flex w-max items-center px-2 py-1 rounded-[var(--radius-pill)] border font-mono text-[9px] uppercase tracking-[0.05em] font-bold active:scale-95 transition-transform relative z-10"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border
      }}
    >
      {verdict}
    </button>
  );
};

const BoardItem = ({ item, onClick, onVerdictClick }: { item: typeof ITEMS[0], onClick: () => void, onVerdictClick: (e: React.MouseEvent, v: string) => void }) => {
  const Visual = VISUALS[item.id];
  
  return (
    <div 
      onClick={onClick}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 flex flex-col gap-2 w-full shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] transition-all text-left active:scale-[0.98] cursor-pointer mb-3 break-inside-avoid"
    >
      <div>
        <VerdictStamp verdict={item.verdict} onClick={onVerdictClick} />
      </div>
      <div className="mt-2">
        <h3 className="font-primary text-[15px] font-bold text-[var(--color-text-primary)] leading-snug mb-1">
          {item.name}
        </h3>
        <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
          {item.metrics.split('·')[0].trim()} <span className="mx-1 opacity-50">·</span> {item.metrics.split('·')[1].trim()}
        </p>
      </div>
      {Visual && (
        <>
          <div className="w-8 h-[2px] bg-[var(--color-divider)] my-2"></div>
          <Visual />
        </>
      )}
    </div>
  );
};

const TrajectoryCard = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left bg-[var(--color-surface)] rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)] border border-[var(--color-border)] active:scale-[0.98] transition-transform overflow-hidden relative block">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold mb-1">Projection</h4>
        <div className="font-primary text-[18px] font-bold text-[var(--color-text-primary)]">Summer '27</div>
      </div>
      <div className="text-right">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold mb-1">Target</h4>
        <div className="font-primary text-[18px] font-bold text-[#10B981]">~$2,400<span className="text-[13px] text-[var(--color-text-secondary)] font-medium">/wk</span></div>
      </div>
    </div>
    
    <div className="h-28 w-full relative mt-2">
      <svg viewBox="0 0 350 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 0,95 L 70,85 L 161,62 L 255,40 L 350,12 L 350,100 L 0,100 Z" fill="url(#chartFill)" />
        <path d="M 0,95 L 70,85" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 70,85 L 161,62 L 255,40 L 350,12" stroke="#10B981" strokeWidth="2.5" strokeDasharray="5,5" fill="none" strokeLinecap="round" />
        
        <circle cx="70" cy="85" r="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
        <circle cx="161" cy="62" r="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
        <circle cx="255" cy="40" r="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
        <circle cx="350" cy="12" r="4" fill="#10B981" />
      </svg>
    </div>
    
    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 text-[var(--color-text-tertiary)] text-[10px] font-mono uppercase tracking-widest font-bold">
      <Maximize2 className="w-3 h-3" /> Tap to expand
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
    <div className="pt-2 pb-2 px-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-sm bg-[var(--color-text-tertiary)]"></div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)] font-bold">How we got here</span>
      </div>
      
      <ul className="space-y-3.5">
        {BULLETS.map((b, i) => (
          <li key={i} className="cursor-pointer group" onClick={() => setExpanded(expanded === i ? null : i)}>
            <div className="flex gap-2 text-[14px] font-semibold text-[var(--color-text-primary)] leading-snug group-active:opacity-70 transition-opacity">
              <span className="text-[var(--color-text-tertiary)] shrink-0 mt-0.5">•</span>
              <span className="flex-1 pr-2">{b.text}</span>
            </div>
            {expanded === i && (
              <div className="mt-2 ml-4 pl-3 border-l-2 border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] font-medium leading-relaxed animate-fade-up">
                {b.source}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

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
        <Breadcrumb onHome={onHome} onBack={onBack} title="Custom cake orders" />
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <h2 className="font-primary text-[24px] font-bold text-[var(--color-text-primary)] mb-2">Revenue vs. Cap</h2>
        <p className="text-[14px] text-[var(--color-text-secondary)] font-medium mb-8 leading-relaxed">Each cake pays $180. Cap is 2/mo ($360). Time is better spent on wholesale pitches by fall.</p>
        
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
        <Breadcrumb onHome={onHome} onBack={onBack} title="Content calendar" />
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-12">
        <h2 className="font-primary text-[24px] font-bold text-[var(--color-text-primary)] mb-6">August 2026</h2>
        
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-mono text-[var(--color-text-tertiary)] font-bold uppercase">
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

        <h3 className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4 font-bold">Planned Posts</h3>
        <div className="space-y-3">
          {Object.entries(posts).map(([d, post]) => (
            <div key={d} className="flex gap-4 p-4 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
              <div className="w-12 text-[13px] font-mono font-bold text-[var(--color-text-secondary)] shrink-0 pt-0.5">Aug {d}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1 truncate">{post.text}</div>
                <div className="text-[10px] font-mono font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">{post.type}</div>
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
    { name: "Food Handler Card", status: "BOOKING NOW", color: "text-[#10B981]", bg: "bg-[#ECFDF5]", rationale: "County requires this before you can touch commercial equipment.", link: "County Health Portal" },
    { name: "Cottage Food Class B", status: "VERIFY YOURSELF", color: "text-[#D97706]", bg: "bg-[#FFFBEB]", rationale: "Permits indirect sales (wholesale to cafes). Must confirm home kitchen limits.", link: "Class B Requirements" },
    { name: "Business License", status: "30 MIN ONLINE", color: "text-[var(--color-text-tertiary)]", bg: "bg-[var(--color-surface)]", rationale: "Basic local compliance. Fast, but needs the Cottage Food address.", link: "City Clerk Site" },
    { name: "Kitchen Agreement", status: "AFTER CAFÉS", color: "text-[var(--color-text-tertiary)]", bg: "bg-[var(--color-surface)]", rationale: "Don't pay rent until the demand is locked in. Wait for two yeses.", link: "Review Lease Template" }
  ];

  return (
    <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title="Kitchen permits" />
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-12">
        <h2 className="font-primary text-[24px] font-bold text-[var(--color-text-primary)] mb-2">Permit Sequence</h2>
        <p className="text-[14px] font-medium text-[var(--color-text-secondary)] mb-8">Strict ordering required. Do not skip steps.</p>
        
        <div className="space-y-5 relative before:absolute before:inset-y-4 before:left-[15px] before:w-[2px] before:bg-[var(--color-border)]">
          {steps.map((step, i) => (
            <div key={i} className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 ml-10 relative shadow-[var(--shadow-sm)]`}>
              <div className="absolute top-6 -left-[32px] w-[14px] h-[14px] rounded-full bg-white border-[3px] border-[var(--color-border)] z-10 flex items-center justify-center">
                {i === 0 && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
              </div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-[var(--color-text-primary)] text-[16px] leading-tight">{step.name}</h3>
                <span className={`${step.color} ${step.bg} px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest shrink-0 text-right`}>{step.status}</span>
              </div>
              <p className="text-[14px] font-medium text-[var(--color-text-secondary)] mb-5 leading-relaxed">{step.rationale}</p>
              <button className={`flex items-center gap-2 ${i === 0 ? 'text-[#10B981]' : 'text-[var(--color-text-tertiary)]'} text-[12px] font-mono font-bold uppercase tracking-widest active:opacity-70 transition-opacity`}>
                <ExternalLink className="w-3.5 h-3.5" /> {step.link}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

const ExpandedFallbackView = ({ item, onBack, onHome }: any) => (
  <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
    <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
      <Breadcrumb onHome={onHome} onBack={onBack} title={item.name} />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex items-center justify-center mb-5">
        <Maximize2 className="w-6 h-6 text-[var(--color-text-tertiary)]" />
      </div>
      <h2 className="font-primary text-[20px] font-bold text-[var(--color-text-primary)] mb-3">{item.name}</h2>
      <p className="text-[14px] font-medium text-[var(--color-text-secondary)] leading-relaxed max-w-[250px]">Detailed interactive visual view would render here.</p>
    </div>
  </div>
);

const TrajectoryView = ({ onBack, onHome }: any) => (
  <div className="fixed inset-0 bg-[var(--color-canvas)] z-[60] flex flex-col animate-slide-up">
    <div className="px-4 pt-6 pb-4 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur-xl">
      <Breadcrumb onHome={onHome} onBack={onBack} title="Revenue Trajectory" />
    </div>
    
    <div className="flex-1 p-5 overflow-y-auto pb-12">
      <h2 className="font-primary text-[28px] font-bold text-[var(--color-text-primary)] mb-8">Now to Summer '27</h2>
      
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
          <div className="absolute left-[6.5px] top-1.5 w-[11px] h-[11px] rounded-full bg-white border-2 border-[#10B981]"></div>
          <div className="text-[11px] font-mono font-bold text-[var(--color-text-tertiary)] mb-1 tracking-widest uppercase">Now (Q3 '26)</div>
          <div className="text-[20px] text-[var(--color-text-primary)] font-bold mb-1 font-primary">~$400 / wk</div>
          <div className="text-[15px] text-[var(--color-text-secondary)] font-primary font-medium leading-relaxed">Saturday farmers market only. Maxed out physical hours.</div>
        </div>

        <div className="relative pl-10">
          <div className="absolute left-[6.5px] top-1.5 w-[11px] h-[11px] rounded-full bg-white border-2 border-[#10B981]"></div>
          <div className="text-[11px] font-mono font-bold text-[var(--color-text-tertiary)] mb-1 tracking-widest uppercase">Q4 '26</div>
          <div className="text-[20px] text-[var(--color-text-primary)] font-bold mb-1 font-primary">~$1,000 / wk</div>
          <div className="text-[15px] text-[var(--color-text-secondary)] font-primary font-medium leading-relaxed">3 wholesale accounts active. Kitchen lease signed.</div>
        </div>

        <div className="relative pl-10">
          <div className="absolute left-[6.5px] top-1.5 w-[11px] h-[11px] rounded-full bg-white border-2 border-[#10B981]"></div>
          <div className="text-[11px] font-mono font-bold text-[var(--color-text-tertiary)] mb-1 tracking-widest uppercase">Q1 '27</div>
          <div className="text-[20px] text-[var(--color-text-primary)] font-bold mb-1 font-primary">~$1,600 / wk</div>
          <div className="text-[15px] text-[var(--color-text-secondary)] font-primary font-medium leading-relaxed">6 wholesale accounts. Smooth weekly delivery cadence.</div>
        </div>

        <div className="relative pl-10">
          <div className="absolute left-[5.5px] top-1.5 w-[13px] h-[13px] rounded-full bg-[#10B981] border-2 border-white shadow-sm"></div>
          <div className="text-[11px] font-mono font-bold text-[#10B981] mb-1 tracking-widest uppercase">Summer '27</div>
          <div className="text-[28px] text-[var(--color-text-primary)] font-bold mb-1 font-primary">~$2,400 / wk</div>
          <div className="text-[15px] text-[var(--color-text-secondary)] font-primary font-medium leading-relaxed">10 accounts. Rent is fully covered by wholesale.</div>
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
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6">
        <div className="mb-6 flex flex-col items-start gap-3">
          <VerdictStamp verdict={item.verdict} onClick={onVerdictClick} />
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">
            {item.metrics.split('·')[0].trim()} <span className="mx-1 opacity-50">·</span> {item.metrics.split('·')[1].trim()}
          </p>
        </div>
        
        <button 
          onClick={() => onPushRoute({ type: 'expanded-visual', id: item.id })}
          className="w-full text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 mb-8 active:scale-[0.98] transition-transform shadow-[var(--shadow-sm)] relative overflow-hidden block"
        >
          {Visual && <Visual />}
          <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-center gap-2 text-[var(--color-text-tertiary)] text-[10px] font-mono uppercase tracking-widest font-bold">
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
                <div className={`max-w-[80%] px-4 py-3.5 rounded-[18px] shadow-[var(--shadow-sm)] ${
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
        
        {chatHistory.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-tertiary)] text-[14px] font-primary font-medium mb-8">
            No conversation yet
          </div>
        )}

        {relatedIds.length > 0 && (
          <div className="mt-8 mb-32 border-t border-[var(--color-border)] pt-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold mb-4">Related Pins</div>
            <div className="flex flex-wrap gap-2">
              {relatedIds.map((rid: string) => {
                const rItem = ITEMS.find(i => i.id === rid);
                if (!rItem) return null;
                return (
                  <button 
                    key={rid}
                    onClick={() => onPushRoute({ type: 'pin', id: rid })}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:shadow-md border border-[var(--color-border)] rounded-[14px] transition-shadow active:scale-95"
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
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-full shrink-0 max-w-[130px]">
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
          <div className="bg-white border border-[var(--color-border)] rounded-2xl px-4 py-3.5 shadow-[var(--shadow-float)] flex flex-col gap-1 w-full relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: STYLE_GUIDE.colors.verdict[toast.title as keyof typeof STYLE_GUIDE.colors.verdict].text }}></div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: STYLE_GUIDE.colors.verdict[toast.title as keyof typeof STYLE_GUIDE.colors.verdict].text }}>{toast.title}</span>
            <span className="text-[14px] text-[var(--color-text-secondary)] font-primary font-semibold ml-0.5">{toast.desc}</span>
          </div>
        </div>
      )}

      {/* Base Board Layer */}
      <div className="w-full max-w-[390px] min-h-screen relative flex flex-col no-scrollbar overflow-y-auto">
        <div className="px-4 py-6 space-y-6">
          <div className="animate-fade-up delay-100">
            <HowWeGotHere />
          </div>
          
          <div className="animate-fade-up delay-200">
            <TrajectoryCard onClick={() => pushRoute({ type: 'trajectory' })} />
          </div>
          
          <div className="columns-2 gap-3 space-y-3 animate-fade-up delay-300">
            {ITEMS.map((item) => (
              <BoardItem key={item.id} item={item} onClick={() => pushRoute({ type: 'pin', id: item.id })} onVerdictClick={handleVerdictClick} />
            ))}
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
                <div className="absolute bottom-full left-0 mb-3 bg-white border border-[var(--color-border)] rounded-2xl p-3.5 text-[13px] font-primary font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-float)] animate-fade-up">
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
