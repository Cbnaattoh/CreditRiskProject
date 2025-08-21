import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export type TooltipType = 'info' | 'help' | 'warning' | 'success';

interface TooltipProps {
  content: string;
  type?: TooltipType;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
  maxWidth?: string;
  showOnHover?: boolean;
  showOnClick?: boolean;
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  type = 'info',
  position = 'top',
  children,
  className = '',
  maxWidth = 'max-w-xs',
  showOnHover = true,
  showOnClick = true,
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const getIcon = () => {
    switch (type) {
      case 'help':
        return <HelpCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'help':
        return 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300';
      case 'warning':
        return 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300';
      case 'success':
        return 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300';
      default:
        return 'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300';
    }
  };

  const getTooltipBg = () => {
    switch (type) {
      case 'help':
        return 'bg-blue-900 dark:bg-blue-800 border-blue-700 dark:border-blue-600';
      case 'warning':
        return 'bg-amber-900 dark:bg-amber-800 border-amber-700 dark:border-amber-600';
      case 'success':
        return 'bg-green-900 dark:bg-green-800 border-green-700 dark:border-green-600';
      default:
        return 'bg-gray-900 dark:bg-gray-800 border-gray-700 dark:border-gray-600';
    }
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  // Auto-adjust position if tooltip goes off screen
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const rect = tooltip.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      // Adjust horizontal position
      if (position === 'right' && rect.right > viewportWidth - 10) {
        newPosition = 'left';
      } else if (position === 'left' && rect.left < 10) {
        newPosition = 'right';
      }

      // Adjust vertical position
      if (position === 'top' && rect.top < 10) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && rect.bottom > viewportHeight - 10) {
        newPosition = 'top';
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const getPositionClasses = () => {
    switch (actualPosition) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    const bgColor = type === 'help' ? 'border-t-blue-900 dark:border-t-blue-800' :
                   type === 'warning' ? 'border-t-amber-900 dark:border-t-amber-800' :
                   type === 'success' ? 'border-t-green-900 dark:border-t-green-800' :
                   'border-t-gray-900 dark:border-t-gray-800';

    switch (actualPosition) {
      case 'top':
        return `absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${bgColor}`;
      case 'bottom':
        return `absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-800`;
      case 'left':
        return `absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900 dark:border-l-gray-800`;
      case 'right':
        return `absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 dark:border-r-gray-800`;
      default:
        return `absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${bgColor}`;
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={triggerRef}>
      {children ? (
        <div
          onMouseEnter={showOnHover ? showTooltip : undefined}
          onMouseLeave={showOnHover ? hideTooltip : undefined}
          onClick={showOnClick ? toggleTooltip : undefined}
          className="cursor-help"
        >
          {children}
        </div>
      ) : (
        <button
          type="button"
          onMouseEnter={showOnHover ? showTooltip : undefined}
          onMouseLeave={showOnHover ? hideTooltip : undefined}
          onClick={showOnClick ? toggleTooltip : undefined}
          className={`inline-flex items-center justify-center transition-colors duration-200 cursor-help ${getIconColor()}`}
          aria-label="Help information"
        >
          {getIcon()}
        </button>
      )}

      {isVisible && (
        <>
          {/* Backdrop for mobile - clicking outside closes tooltip */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={hideTooltip}
          />
          
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className={`absolute z-50 ${getPositionClasses()} ${maxWidth} p-3 text-white text-sm rounded-lg shadow-xl border ${getTooltipBg()} backdrop-blur-sm`}
            role="tooltip"
          >
            <div className="relative">
              {content}
              <div className={getArrowClasses()}></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Tooltip;