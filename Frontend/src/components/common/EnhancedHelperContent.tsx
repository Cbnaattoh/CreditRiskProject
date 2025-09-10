import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  FiHelpCircle, 
  FiInfo, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiX, 
  FiBook,
  FiZap,
  FiTarget,
  FiShield
} from 'react-icons/fi';

export type HelperType = 'info' | 'tip' | 'warning' | 'success' | 'guide';

export interface HelperSection {
  title: string;
  content: string;
  type?: HelperType;
  bullets?: string[];
  example?: string;
  formula?: string;
  tip?: string;
}

export interface EnhancedHelperProps {
  title: string;
  sections: HelperSection[];
  triggerType?: 'icon' | 'button' | 'text';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  maxWidth?: string;
  className?: string;
  children?: React.ReactNode;
}

const EnhancedHelperContent: React.FC<EnhancedHelperProps> = ({
  title,
  sections,
  triggerType = 'icon',
  position = 'top',
  maxWidth = 'max-w-5xl',
  className = '',
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [isMobile, setIsMobile] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const helperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Smart positioning based on field location and available space
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const trigger = triggerRef.current;
      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      if (position === 'center') {
        return;
      }

      // Always try bottom first for form fields, then top if not enough space
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const helperHeight = 400; // Estimated helper height
      
      if (spaceBelow >= helperHeight || spaceBelow > spaceAbove) {
        newPosition = 'bottom';
      } else if (spaceAbove >= helperHeight) {
        newPosition = 'top';
      } else {
        // If neither top nor bottom has enough space, prefer bottom for consistency
        newPosition = 'bottom';
      }

      setActualPosition(newPosition);
    }
  }, [isOpen, position, forceUpdate]);

  const getTypeIcon = (type: HelperType = 'info') => {
    const iconClass = "h-3 w-3";
    switch (type) {
      case 'tip':
        return <FiZap className={iconClass} />;
      case 'warning':
        return <FiAlertTriangle className={iconClass} />;
      case 'success':
        return <FiCheckCircle className={iconClass} />;
      case 'guide':
        return <FiTarget className={iconClass} />;
      default:
        return <FiInfo className={iconClass} />;
    }
  };

  const getTypeColor = (type: HelperType = 'info') => {
    switch (type) {
      case 'tip':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30';
      case 'warning':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30';
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/30';
      case 'guide':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/30';
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30';
    }
  };

  const getHelperPosition = () => {
    if (!triggerRef.current) return { left: 0, top: 0 };
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const helperWidth = isMobile ? viewportWidth * 0.95 : 500; // Fixed width, allow overflow
    const helperHeight = 400; // Estimated height
    
    let left: number;
    let top: number;
    
    // Calculate horizontal position
    const fieldCenter = triggerRect.left + (triggerRect.width / 2);
    const centerLeft = fieldCenter - (helperWidth / 2);
    const centerRight = fieldCenter + (helperWidth / 2);
    
    // Always try to center on the field first, allow overflow if needed
    if (centerLeft >= 20 && centerRight <= viewportWidth - 20) {
      // Perfect center fit
      left = centerLeft;
    } else if (centerLeft < 20) {
      // Field is too close to left edge, align to left with margin
      left = 20;
    } else {
      // Field is too close to right edge, align to right with margin
      left = viewportWidth - helperWidth - 20;
      //  console.log('Right edge positioning');
    }
    
    // Calculate vertical position
    if (actualPosition === 'top') {
      top = triggerRect.top - helperHeight - 12;
      if (top < 20) {
        // Not enough space above, show below instead
        top = triggerRect.bottom + 12;
      }
    } else {
      // Default to bottom
      top = triggerRect.bottom + 12;
      if (top + helperHeight > viewportHeight - 20) {
        // Not enough space below, show above instead
        top = triggerRect.top - helperHeight - 12;
        if (top < 20) {
          // Not enough space above either, show at top of viewport
          top = 20;
        }
      }
    }
    
    // // Debug logging
    // if (import.meta.env.MODE === 'development') {
    //   console.log('Fixed Position Calculation:', {
    //     triggerRect,
    //     viewportWidth,
    //     helperWidth,
    //     fieldCenter,
    //     calculatedLeft: left,
    //     calculatedTop: top,
    //     actualPosition
    //   });
    // }
    
    return { left, top };
  };

  const getArrowPosition = () => {
    if (!triggerRef.current || position === 'center') return { display: 'none' };
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const helperPosition = getHelperPosition();
    
    // Calculate arrow position relative to the trigger
    const arrowLeft = triggerRect.left + (triggerRect.width / 2) - helperPosition.left - 8; // Center on trigger, account for arrow width
    
    let arrowStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${Math.max(12, Math.min(arrowLeft, 500 - 24))}px`, // Keep arrow within helper bounds
      width: 0,
      height: 0,
    };
    
    if (actualPosition === 'top') {
      arrowStyle = {
        ...arrowStyle,
        bottom: '-8px',
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: '8px solid white',
      };
    } else {
      // Default to bottom
      arrowStyle = {
        ...arrowStyle,
        top: '-8px',
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: '8px solid white',
      };
    }
    
    return arrowStyle;
  };

  const handleTriggerInteraction = () => {
    setIsOpen(!isOpen);
    // Force positioning recalculation
    setForceUpdate(prev => prev + 1);
  };

  const renderTrigger = () => {
    const triggerClasses = "cursor-help transition-all duration-200 touch-manipulation";
    const mobileClasses = isMobile ? "active:scale-95" : "hover:scale-105";
    
    if (children) {
      return (
        <div
          onClick={handleTriggerInteraction}
          onMouseEnter={() => !isMobile && setIsOpen(true)}
          onMouseLeave={() => !isMobile && setIsOpen(false)}
          onTouchStart={isMobile ? handleTriggerInteraction : undefined}
          className={`${triggerClasses} ${mobileClasses} ${className}`}
        >
          {children}
        </div>
      );
    }

    switch (triggerType) {
      case 'button':
        return (
          <button
            onClick={handleTriggerInteraction}
            onMouseEnter={() => !isMobile && setIsOpen(true)}
            onMouseLeave={() => !isMobile && setIsOpen(false)}
            onTouchStart={isMobile ? handleTriggerInteraction : undefined}
            className={`${triggerClasses} ${mobileClasses} px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-medium ${className}`}
          >
            <FiHelpCircle className="h-4 w-4 mr-1.5 inline" />
            Help
          </button>
        );
      case 'text':
        return (
          <span
            onClick={handleTriggerInteraction}
            onMouseEnter={() => !isMobile && setIsOpen(true)}
            onMouseLeave={() => !isMobile && setIsOpen(false)}
            onTouchStart={isMobile ? handleTriggerInteraction : undefined}
            className={`${triggerClasses} ${mobileClasses} text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-dotted ${className}`}
          >
            Need help?
          </span>
        );
      default:
        return (
          <button
            onClick={handleTriggerInteraction}
            onMouseEnter={() => !isMobile && setIsOpen(true)}
            onMouseLeave={() => !isMobile && setIsOpen(false)}
            onTouchStart={isMobile ? handleTriggerInteraction : undefined}
            className={`${triggerClasses} ${mobileClasses} text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ${className}`}
            aria-label="Show help information"
          >
            <FiHelpCircle className="h-5 w-5" />
          </button>
        );
    }
  };

  const renderSection = (section: HelperSection, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="space-y-2 h-full"
    >
      {section.title && (
        <div className="flex items-center gap-1.5">
          {getTypeIcon(section.type)}
          <h4 className="font-semibold text-gray-900 dark:text-white text-xs">
            {section.title}
          </h4>
        </div>
      )}
      
      <div className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
        {section.content}
      </div>

      {section.bullets && section.bullets.length > 0 && (
        <div className="space-y-1 ml-3">
          {section.bullets.map((bullet, bulletIndex) => (
            <div key={bulletIndex} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
              <span className="text-blue-500 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0">•</span>
              <span className="leading-tight">{bullet}</span>
            </div>
          ))}
        </div>
      )}

      {section.formula && (
        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 border-l-4 border-indigo-500">
          <div className="flex items-center gap-1.5 mb-1">
            <FiTarget className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-indigo-900 dark:text-indigo-100 text-xs">Formula:</span>
          </div>
          <code className="text-xs font-mono text-indigo-800 dark:text-indigo-200">
            {section.formula}
          </code>
        </div>
      )}

      {section.example && (
        <div className={`rounded-lg p-2 border ${getTypeColor(section.type || 'info')}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <FiBook className="h-3 w-3" />
            <span className="font-medium text-xs">Example:</span>
          </div>
          <p className="text-xs leading-tight">{section.example}</p>
        </div>
      )}

      {section.tip && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200 dark:border-amber-700/30">
          <div className="flex items-center gap-1.5 mb-1">
            <FiZap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-amber-900 dark:text-amber-100 text-xs">Pro Tip:</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-tight">{section.tip}</p>
        </div>
      )}
    </motion.div>
  );

  // Close helper when clicking outside on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      const handleTouchOutside = (event: TouchEvent) => {
        if (helperRef.current && !helperRef.current.contains(event.target as Node) &&
            triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('touchstart', handleTouchOutside);
      return () => document.removeEventListener('touchstart', handleTouchOutside);
    }
  }, [isMobile, isOpen]);

  const helperPosition = getHelperPosition();
  const arrowStyle = getArrowPosition();

  const helperContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {position === 'center' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
          )}

          <motion.div
            ref={helperRef}
            initial={{ 
              opacity: 0, 
              scale: position === 'center' ? 0.95 : 1,
              y: position === 'center' ? 20 : actualPosition === 'top' ? 10 : actualPosition === 'bottom' ? -10 : 0,
              x: 0
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0,
              x: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: position === 'center' ? 0.95 : 1,
              y: position === 'center' ? 20 : actualPosition === 'top' ? 10 : actualPosition === 'bottom' ? -10 : 0,
              x: 0
            }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={position === 'center' ? 'fixed inset-0 flex items-center justify-center z-50' : 'fixed z-[9999]'}
            style={position !== 'center' ? {
              left: `${helperPosition.left}px`,
              top: `${helperPosition.top}px`,
            } : undefined}
          >
            <div className={`${isMobile ? 'max-w-[95vw] w-full max-h-[90vh]' : 'w-[500px] max-h-[85vh]'} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col relative`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-3 py-2 border-b border-blue-100 dark:border-blue-700/30 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiShield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                        {title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-0.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 transition-colors"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scroll-smooth">
                  <div className="p-4 pb-6">
                    {/* Horizontal layout optimized for sentence readability */}
                    <div className={`${sections.length > 1 ? 'flex flex-col gap-4' : 'space-y-3'}`}>
                      {sections.map((section, index) => (
                        <div key={index} className="w-full">
                          {renderSection(section, index)}
                          {index < sections.length - 1 && (
                            <hr className="border-gray-200 dark:border-gray-700 mt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Scroll indicator - shows there's more content below */}
                    {sections.length > 1 && (
                      <div className="text-center pt-3 text-xs text-gray-500 dark:text-gray-400">
                        {sections.length > 2 ? 'Scroll to see more content' : ''}
                      </div>
                    )}
                  </div>
                </div>

              {/* Arrow */}
              {position !== 'center' && (
                <div style={arrowStyle}></div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative inline-flex z-10" ref={triggerRef}>
      {renderTrigger()}
      {typeof window !== 'undefined' && createPortal(helperContent, document.body)}
    </div>
  );
};

export default EnhancedHelperContent;