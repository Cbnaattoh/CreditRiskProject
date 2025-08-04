import { useState, useCallback } from 'react';

interface HelpTip {
  id: string;
  title: string;
  content: string;
  type: "tip" | "tutorial" | "warning" | "info";
  relatedLinks?: Array<{
    title: string;
    url: string;
  }>;
}

interface UseHelpReturn {
  isHelpOpen: boolean;
  openHelp: (context?: string, customTips?: HelpTip[]) => void;
  closeHelp: () => void;
  helpContext: string;
  customTips: HelpTip[];
}

export const useHelp = (): UseHelpReturn => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpContext, setHelpContext] = useState('general');
  const [customTips, setCustomTips] = useState<HelpTip[]>([]);

  const openHelp = useCallback((context = 'general', tips: HelpTip[] = []) => {
    setHelpContext(context);
    setCustomTips(tips);
    setIsHelpOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  return {
    isHelpOpen,
    openHelp,
    closeHelp,
    helpContext,
    customTips,
  };
};

export default useHelp;