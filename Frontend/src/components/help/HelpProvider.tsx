import React, { createContext, useContext } from 'react';
import { useHelp } from './useHelp';
import HelpModal from './HelpModal';

interface HelpContextType {
  openHelp: (context?: string, customTips?: any[]) => void;
  closeHelp: () => void;
  isHelpOpen: boolean;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export const useHelpContext = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelpContext must be used within a HelpProvider');
  }
  return context;
};

interface HelpProviderProps {
  children: React.ReactNode;
}

export const HelpProvider: React.FC<HelpProviderProps> = ({ children }) => {
  const { isHelpOpen, openHelp, closeHelp, helpContext, customTips } = useHelp();

  return (
    <HelpContext.Provider value={{ openHelp, closeHelp, isHelpOpen }}>
      {children}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={closeHelp}
        context={helpContext}
        tips={customTips}
      />
    </HelpContext.Provider>
  );
};

export default HelpProvider;