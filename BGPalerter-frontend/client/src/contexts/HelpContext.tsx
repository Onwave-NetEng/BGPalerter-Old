import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getHelpContent, HelpContent } from '@/lib/helpContent';

interface HelpContextType {
  showHelp: (id: string, x: number, y: number) => void;
  hideHelp: () => void;
  currentHelp: { content: HelpContent; x: number; y: number } | null;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [currentHelp, setCurrentHelp] = useState<{ content: HelpContent; x: number; y: number } | null>(null);

  const showHelp = useCallback((id: string, x: number, y: number) => {
    const content = getHelpContent(id);
    if (content) {
      setCurrentHelp({ content, x, y });
    }
  }, []);

  const hideHelp = useCallback(() => {
    setCurrentHelp(null);
  }, []);

  // Close help popup when clicking outside or pressing Escape
  useEffect(() => {
    const handleClick = () => hideHelp();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideHelp();
    };

    if (currentHelp) {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [currentHelp, hideHelp]);

  return (
    <HelpContext.Provider value={{ showHelp, hideHelp, currentHelp }}>
      {children}
      {currentHelp && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-4 max-w-sm"
          style={{
            left: `${currentHelp.x}px`,
            top: `${currentHelp.y}px`,
            transform: 'translate(-50%, 10px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">{currentHelp.content.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentHelp.content.description}
            </p>
          </div>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-border"></div>
        </div>
      )}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}

// Hook to add help to an element
export function useHelpTarget(helpId: string) {
  const { showHelp } = useHelp();

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      showHelp(helpId, e.clientX, e.clientY);
    },
    [helpId, showHelp]
  );

  return { onContextMenu: handleContextMenu };
}
