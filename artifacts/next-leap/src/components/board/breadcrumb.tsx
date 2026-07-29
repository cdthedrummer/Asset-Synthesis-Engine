import React from 'react';

export const Breadcrumb = ({ onHome, onBack, title }: { onHome: () => void, onBack?: () => void, title: string }) => (
  <div className="flex items-center gap-1.5 text-body font-sans font-medium">
    <button onClick={onHome} className="text-muted-foreground hover:text-foreground py-2 pr-2 active:scale-95 transition-colors">Board</button>
    <span className="text-border shrink-0">/</span>
    {onBack && (
      <>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground px-2 py-2 active:scale-95 transition-colors">Back</button>
        <span className="text-border shrink-0">/</span>
      </>
    )}
    <span className="text-foreground pl-1 truncate flex-1 font-bold">{title}</span>
  </div>
);
