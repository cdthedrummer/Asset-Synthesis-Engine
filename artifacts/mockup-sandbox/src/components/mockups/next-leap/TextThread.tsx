import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, MoreHorizontal, LayoutGrid } from "lucide-react";

const VERDICT_COLORS = {
  START: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  SCHEDULE: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "SKIP FOR NOW": "text-zinc-500 border-zinc-700 bg-zinc-800/50",
  "GET HELP": "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

interface MessageProps {
  children: React.ReactNode;
  delay?: number;
}

const CoachText = ({ children, delay = 0 }: MessageProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
    className="pr-12 pl-4 py-1"
  >
    <p className="text-[17px] leading-[1.4] tracking-[-0.01em] text-zinc-100 font-medium font-sans">
      {children}
    </p>
  </motion.div>
);

const UserBubble = ({ children, delay = 0 }: MessageProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, originX: 1, originY: 1 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
    className="flex justify-end pl-12 pr-4 py-3"
  >
    <div className="bg-zinc-800 text-zinc-300 px-4 py-3 rounded-2xl rounded-br-sm text-[16px] leading-[1.4] tracking-[-0.01em] shadow-sm font-sans max-w-[90%]">
      {children}
    </div>
  </motion.div>
);

const VerdictCard = ({
  name,
  difficulty,
  impact,
  verdict,
  oneLiner,
  delay = 0,
}: {
  name: string;
  difficulty: string;
  impact: string;
  verdict: keyof typeof VERDICT_COLORS;
  oneLiner: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    className="mx-4 my-3 p-5 rounded-2xl border border-zinc-800 bg-[#0F0F13] shadow-lg flex flex-col gap-4 font-sans"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-zinc-100 font-semibold text-[17px] leading-tight tracking-[-0.01em] mb-1.5">
          {name}
        </h3>
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
          {difficulty} &middot; {impact}
        </p>
      </div>
      <div
        className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-widest uppercase shrink-0 border ${VERDICT_COLORS[verdict]}`}
      >
        {verdict}
      </div>
    </div>
    <div className="h-px bg-zinc-800/50 w-full" />
    <p className="text-zinc-300 text-[15px] leading-relaxed">
      {oneLiner}
    </p>
  </motion.div>
);

const NextMovesCard = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    className="mx-4 my-4 p-1 rounded-2xl bg-gradient-to-b from-indigo-500/20 to-transparent border border-indigo-500/20 shadow-2xl relative overflow-hidden"
  >
    <div className="absolute top-0 left-0 w-full h-[100px] bg-indigo-500/10 blur-[40px] pointer-events-none" />
    
    <div className="bg-[#0A0A0E] rounded-xl p-5 relative z-10 border border-zinc-800/50">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        <h3 className="text-indigo-400 font-semibold text-sm tracking-widest uppercase">
          Next Three Moves
        </h3>
      </div>
      
      <div className="flex flex-col gap-4 font-sans">
        <div className="flex gap-4 items-start">
          <div className="text-zinc-600 font-mono text-sm pt-0.5">01</div>
          <p className="text-zinc-200 text-[15px] leading-snug">
            Book the food-handler exam — <span className="text-zinc-400">tonight, 20 minutes.</span>
          </p>
        </div>
        <div className="flex gap-4 items-start">
          <div className="text-zinc-600 font-mono text-sm pt-0.5">02</div>
          <p className="text-zinc-200 text-[15px] leading-snug">
            Draft the café pitch with me — <span className="text-zinc-400">tomorrow.</span>
          </p>
        </div>
        <div className="flex gap-4 items-start">
          <div className="text-zinc-600 font-mono text-sm pt-0.5">03</div>
          <p className="text-zinc-200 text-[15px] leading-snug">
            Walk into Fern &amp; Grounds with samples — <span className="text-zinc-400">Friday, before the 10am rush.</span>
          </p>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function TextThread() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Attempt to scroll to bottom after initial animation load
    const timeout = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 2500); // after all animations
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="w-full h-[100dvh] bg-[#06060A] text-zinc-100 flex flex-col font-sans relative overflow-hidden">
      
      {/* Subtle Header */}
      <div className="h-14 flex items-center justify-between px-5 shrink-0 z-20 bg-gradient-to-b from-[#06060A] to-transparent">
        <div className="text-[13px] font-bold tracking-[0.2em] text-zinc-600 uppercase">
          Next Leap
        </div>
        <button className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 text-sm font-medium">
          <LayoutGrid className="w-4 h-4" />
          <span className="sr-only">Board</span>
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-28 pt-4 scroll-smooth hide-scrollbar flex flex-col gap-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
        
        <CoachText delay={0.2}>
          You bake every Saturday and sell out by noon. What does the version that pays rent look like, 12 months out? Numbers, not adjectives — accounts, hours, dollars.
        </CoachText>

        <UserBubble delay={0.6}>
          Maybe 10 wholesale accounts? I've got 10 hours a week and about $2,000 I could spend without panicking. The website's half-built and I still haven't booked the food-handler cert.
        </UserBubble>

        <div className="h-4" /> {/* Spacer */}

        <CoachText delay={1.2}>
          Demand isn't your problem — sell-out Saturdays settled that. The cert is a 20-minute signup you've dodged for months. That's fear dressed up as busy. It goes first.
        </CoachText>

        <VerdictCard
          delay={1.8}
          name="Food-handler certification"
          difficulty="Easy"
          impact="High impact"
          verdict="START"
          oneLiner="Book the exam tonight. Twenty minutes. You've spent longer avoiding it."
        />

        <VerdictCard
          delay={2.1}
          name="Commercial kitchen lease"
          difficulty="Hard"
          impact="High impact"
          verdict="GET HELP"
          oneLiner="County permits first — verify those yourself before signing anything. Nothing irreversible in month one."
        />

        <div className="h-6" /> {/* Spacer */}

        <NextMovesCard delay={2.6} />

        <div className="h-2" /> {/* Spacer */}

        <CoachText delay={3.4}>
          My bet: the website is where you'll hide. Polishing fonts feels like progress and risks nothing. Catch yourself doing it, close the tab, and send one pitch email instead.
        </CoachText>
        
        <div className="h-8" />
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#06060A] via-[#06060A] to-transparent pt-12 z-20">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Message..."
            className="w-full bg-[#1A1A21] border border-zinc-800 rounded-full py-3.5 pl-5 pr-12 text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors font-sans shadow-lg"
          />
          <button className="absolute right-2 w-9 h-9 flex items-center justify-center bg-zinc-100 hover:bg-white text-zinc-900 rounded-full transition-transform active:scale-95 shadow-sm">
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
