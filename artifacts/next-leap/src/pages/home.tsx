import React from 'react';
import { useLocation } from 'wouter';
import { useCreateLeapBoard, useListLeapDemos } from '@workspace/api-client-react';

export default function Home() {
  const [, setLocation] = useLocation();
  const [goal, setGoal] = React.useState('');
  const [name, setName] = React.useState('');
  const createBoard = useCreateLeapBoard();
  const { data: demos } = useListLeapDemos();

  const handleCreate = (door: 'ambition' | 'juggle') => {
    if (!goal.trim()) return;
    createBoard.mutate({ data: { goalText: goal, door, name: name.trim() || "Friend" } }, {
      onSuccess: (state) => {
        setLocation(`/b/${state.board.token}`);
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-4xl font-bold font-sans text-foreground mb-4">Next Leap</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            One link. One interview. One pinboard that builds itself while you talk. Let's find your next three moves.
          </p>
        </div>

        <div className="space-y-4 text-left">
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="First name (optional)"
            className="w-full bg-card border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors font-sans"
          />
          <textarea 
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="What's going on?"
            className="w-full h-32 resize-none bg-card border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-colors font-sans"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleCreate('ambition')}
              disabled={!goal.trim() || createBoard.isPending}
              className="py-4 bg-[#1C1917] text-white rounded-xl font-bold font-sans active:scale-95 transition-transform disabled:opacity-50"
            >
              I want to become...
            </button>
            <button 
              onClick={() => handleCreate('juggle')}
              disabled={!goal.trim() || createBoard.isPending}
              className="py-4 bg-card border border-border text-foreground rounded-xl font-bold font-sans hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
            >
              I'm juggling everything
            </button>
          </div>
        </div>

        {demos && demos.length > 0 && (
          <div className="pt-12">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold mb-4">Or view a demo</div>
            <div className="flex gap-3 justify-center">
              {demos.map(demo => (
                <button 
                  key={demo.token}
                  onClick={() => setLocation(`/b/${demo.token}`)}
                  className="bg-card border border-border px-4 py-3 rounded-[16px] hover:shadow-md transition-all text-left"
                >
                  <div className="font-bold text-foreground font-sans">{demo.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{demo.tagline}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
