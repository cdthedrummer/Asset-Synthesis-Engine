import React, { useState } from 'react';
import { ArrowUp, X, GripVertical, Plus, ArrowLeft, ChevronRight } from 'lucide-react';

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
      <div className="flex justify-between items-baseline">
        <span className="text-white/80 text-[12px]">Sourdough Loaf</span>
        <span className="text-white/50 text-[11px] font-mono">$9</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-white/80 text-[12px]">Morning Buns (4)</span>
        <span className="text-white/50 text-[11px] font-mono">$12</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-white/80 text-[12px]">Seeded Rye</span>
        <span className="text-white/50 text-[11px] font-mono">$8</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-white/80 text-[12px]">Galette of the Week</span>
        <span className="text-white/50 text-[11px] font-mono">$14</span>
      </div>
    </div>
  </div>
);

const KitchenVisual = () => (
  <div className="space-y-1.5 py-1 text-[11px]">
    <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
      <div className="flex-1 text-white/40 font-mono text-[9px] uppercase tracking-wider">Permit</div>
      <div className="w-12 text-white/40 font-mono text-[9px] uppercase tracking-wider">Order</div>
      <div className="w-16 text-white/40 font-mono text-[9px] uppercase tracking-wider">Status</div>
    </div>
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 text-white/90 text-[11.5px]">Food Handler Card</div>
      <div className="w-12 text-[#00FF66] font-mono text-[10px]">1st</div>
      <div className="w-16 text-white/60 text-[10px]">booking now</div>
    </div>
    <div className="flex items-center gap-2 py-1 bg-[#00CCFF]/5 -mx-2 px-2 rounded">
      <div className="flex-1 text-white/90 text-[11.5px]">Cottage Food B</div>
      <div className="w-12 text-[#FFB800] font-mono text-[10px]">2nd</div>
      <div className="w-16 text-[#00CCFF] text-[10px] underline decoration-dotted">verify</div>
    </div>
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 text-white/70 text-[11.5px]">Business License</div>
      <div className="w-12 text-white/40 font-mono text-[10px]">3rd</div>
      <div className="w-16 text-white/40 text-[10px]">30 min</div>
    </div>
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 text-white/50 text-[11.5px]">Kitchen Agreement</div>
      <div className="w-12 text-white/30 font-mono text-[10px]">4th</div>
      <div className="w-16 text-white/30 text-[10px]">after cafés</div>
    </div>
  </div>
);

const InstagramVisual = () => {
  const dates = ['Jul 26', 'Jul 27', 'Jul 28', 'Jul 29', 'Jul 30', 'Jul 31', 'Aug 1'];
  const posts = [0, -1, -1, 3, -1, -1, 0];
  
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-3">
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
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF3366]"></div>
          <span>Sat: sell-out shot</span>
        </div>
        <div className="flex items-center gap-2 text-white/50">
          <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
          <span>Wed: proofing timelapse</span>
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

const BoardItem = ({ item, onClick }: { item: typeof ITEMS[0], onClick: () => void }) => {
  const Visual = VISUALS[item.id];
  
  return (
    <button 
      onClick={onClick}
      className="bg-[#111111] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2 w-full shadow-sm hover:border-white/20 transition-colors text-left active:scale-[0.98]"
    >
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
      {Visual && <Visual />}
    </button>
  );
};

const BeforeAfterCard = () => (
  <div className="relative bg-[#1A1810] border border-[#FFB800]/30 rounded-2xl p-5 overflow-hidden shadow-[0_4px_20px_rgba(255,184,0,0.05)]">
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
    </div>
  </div>
);

const HowWeGotHere = () => (
  <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 font-outfit shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-sm bg-white/20"></div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-white/40 font-bold">How we got here</span>
    </div>
    
    <ul className="space-y-2.5 text-[13px] text-white/70 leading-relaxed">
      <li className="flex gap-2">
        <span className="text-white/30">•</span>
        <span>Sells out every Saturday by noon (demand proven)</span>
      </li>
      <li className="flex gap-2">
        <span className="text-white/30">•</span>
        <span>10 hrs/wk and $2,000 to invest without panic</span>
      </li>
      <li className="flex gap-2">
        <span className="text-white/30">•</span>
        <span>Goal: 10 wholesale accounts by summer 2027</span>
      </li>
    </ul>
  </div>
);

const PinnedSection = ({ onPinClick }: { onPinClick: (pinId: string) => void }) => (
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
      {MOVES.map((move, idx) => (
        <button
          key={idx}
          onClick={() => onPinClick(move.pinId)}
          className="flex gap-3 items-start group w-full text-left"
        >
          <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0 mt-1 group-hover:text-white/40 transition-colors" />
          <div className={`${idx === 0 ? 'w-5 h-5 rounded-full bg-[#00FF66]/20' : 'w-5 h-5 rounded-full border border-white/20'} flex items-center justify-center flex-shrink-0 mt-0.5 relative`}>
            {idx === 0 ? (
              <div className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></div>
            ) : (
              <span className="text-white/30 font-mono text-[9px]">{idx + 1}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`font-outfit ${idx === 0 ? 'text-white/90 font-medium group-hover:text-[#00FF66]' : 'text-white/70'} text-[15px] leading-snug transition-colors`}>
                {move.text}
              </p>
              <div className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-mono text-white/30 uppercase tracking-wider">
                {ITEMS.find(i => i.id === move.pinId)?.name.split(' ')[0]}
              </div>
            </div>
            <p className="font-mono text-white/40 text-[10px] uppercase tracking-wide">{move.time}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const DetailView = ({ 
  item, 
  onClose, 
  allItems, 
  onSwitchPin 
}: { 
  item: typeof ITEMS[0], 
  onClose: () => void,
  allItems: typeof ITEMS,
  onSwitchPin: (id: string) => void
}) => {
  const Visual = VISUALS[item.id];
  const chatHistory = CHAT_HISTORY[item.id] || [];
  const [inputValue, setInputValue] = useState('');
  
  const otherPins = allItems.filter(i => i.id !== item.id);
  
  return (
    <div className="fixed inset-0 bg-[#000000] z-50 flex flex-col animate-slide-up">
      <div className="px-4 pt-6 pb-4 border-b border-white/10 bg-[#111111]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-outfit">Board</span>
          </button>
          <div className="flex gap-1 opacity-50">
            <div className="w-1 h-1 rounded-full bg-white"></div>
            <div className="w-1 h-1 rounded-full bg-white"></div>
            <div className="w-1 h-1 rounded-full bg-white"></div>
          </div>
        </div>
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] border ${item.bg} ${item.border} ${item.color} font-mono text-[9px] uppercase tracking-widest font-bold mb-3`}>
              {item.verdict}
            </div>
            <h2 className="font-outfit text-[20px] font-medium text-white/90 leading-tight">
              {item.name}
            </h2>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-wide mt-1">
              {item.metrics.split('·')[0].trim()} <span className="mx-0.5 opacity-50">·</span> {item.metrics.split('·')[1].trim()}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {otherPins.map(pin => (
            <button
              key={pin.id}
              onClick={() => onSwitchPin(pin.id)}
              className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg shrink-0 transition-colors"
            >
              <span className="text-[11px] text-white/60 whitespace-nowrap">{pin.name.split(' ')[0]}</span>
              <ChevronRight className="w-3 h-3 text-white/30" />
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 mb-5">
          {Visual && <Visual />}
        </div>
        
        {chatHistory.length > 0 && (
          <div className="space-y-4 mb-32">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-sm bg-white/30"></div>
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
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
          <div className="text-center py-12 text-white/30 text-[13px] font-outfit">
            No conversation yet
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent pointer-events-none pb-6">
        <div className="bg-[#1A1A1A]/90 border border-white/10 rounded-full p-1.5 pl-3 flex items-center gap-2 pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all focus-within:border-white/30 focus-within:bg-[#222]/90">
          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full shrink-0">
            <span className="text-[10px] text-white/50 font-outfit">{item.name.split(' ')[0]}</span>
            <button className="text-white/30 hover:text-white/60">
              <X className="w-3 h-3" />
            </button>
          </div>
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this..." 
            className="flex-1 bg-transparent border-none outline-none text-white font-outfit text-[14px] placeholder-white/30"
          />
          <button className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 hover:bg-[#00FF66] hover:text-black transition-colors active:scale-95">
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PinboardV2() {
  const [activePin, setActivePin] = useState<string | null>(null);
  const [showAddHint, setShowAddHint] = useState(false);
  
  const activePinItem = activePin ? ITEMS.find(i => i.id === activePin) : null;
  
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
        .delay-500 { animation-delay: 500ms; }
      `}</style>
      
      {/* Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {activePinItem ? (
        <DetailView 
          item={activePinItem} 
          onClose={() => setActivePin(null)}
          allItems={ITEMS}
          onSwitchPin={setActivePin}
        />
      ) : (
        <div className="w-full max-w-[390px] min-h-screen relative flex flex-col no-scrollbar overflow-y-auto">
          <PinnedSection onPinClick={setActivePin} />
          
          <div className="px-4 py-5 space-y-4">
            <div className="animate-fade-up delay-100">
              <HowWeGotHere />
            </div>
            
            <div className="grid grid-cols-2 gap-3 items-start animate-fade-up delay-200">
              <BoardItem item={ITEMS[0]} onClick={() => setActivePin(ITEMS[0].id)} />
              <BoardItem item={ITEMS[1]} onClick={() => setActivePin(ITEMS[1].id)} />
            </div>
            
            <div className="animate-fade-up delay-300">
              <BeforeAfterCard />
            </div>
            
            <div className="grid grid-cols-2 gap-3 items-start animate-fade-up delay-400">
              <div className="flex flex-col gap-3">
                <BoardItem item={ITEMS[2]} onClick={() => setActivePin(ITEMS[2].id)} />
                <BoardItem item={ITEMS[4]} onClick={() => setActivePin(ITEMS[4].id)} />
              </div>
              <div className="flex flex-col gap-3">
                <BoardItem item={ITEMS[3]} onClick={() => setActivePin(ITEMS[3].id)} />
                <BoardItem item={ITEMS[5]} onClick={() => setActivePin(ITEMS[5].id)} />
              </div>
            </div>
            
            {/* Spacer for bottom bar */}
            <div className="h-28 w-full"></div>
          </div>

          {/* Input Bar */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] p-4 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent pointer-events-none pb-6 z-50 animate-fade-up delay-500">
            <div className="flex items-end gap-2 pointer-events-auto">
              <div className="relative flex-1">
                <div className="bg-[#1A1A1A]/90 border border-white/10 rounded-full p-1.5 pl-5 flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all focus-within:border-white/30 focus-within:bg-[#222]/90">
                  <input 
                    type="text" 
                    placeholder="Ask, or add a pin..." 
                    className="flex-1 bg-transparent border-none outline-none text-white font-outfit text-[14px] placeholder-white/30"
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
      )}
    </div>
  );
}
