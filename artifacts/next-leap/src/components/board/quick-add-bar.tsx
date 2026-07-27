import React from 'react';
import { ArrowUp } from 'lucide-react';
import { useQuickAddLeapPin, getGetLeapBoardQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export const QuickAddBar = ({ boardId, token }: { boardId: number, token: string }) => {
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const quickAdd = useQuickAddLeapPin();
  const isDemo = token.startsWith('demo-');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);

    quickAdd.mutate({ token, data: { text } }, {
      onSuccess: () => {
        setText('');
        // Invalidate board to fetch new pin
        queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });
      },
      onError: () => {
        setError(isDemo ? 'Demo boards are read-only — start your own from the front door.' : "Couldn't add that — try again.");
      }
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-background via-background to-transparent z-40 pointer-events-none">
      <div className="max-w-[400px] mx-auto pointer-events-auto">
        {error && <p className="text-center text-[#BE123C] text-xs mb-2 bg-background/90 rounded-full px-3 py-1">{error}</p>}
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add something..." 
            disabled={quickAdd.isPending}
            className="w-full bg-card shadow-lg border border-border rounded-full py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all font-sans text-[15px] placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!text.trim() || quickAdd.isPending}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-[#10B981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-muted-foreground"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
