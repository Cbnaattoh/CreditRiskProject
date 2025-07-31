import React from 'react';

interface SafeRenderProps {
  value: any;
  fallback?: string;
  className?: string;
}

/**
 * Safely renders any value, converting objects to strings to prevent React rendering errors
 */
export const SafeRender: React.FC<SafeRenderProps> = ({ 
  value, 
  fallback = 'N/A',
  className 
}) => {
  const renderValue = () => {
    if (value === null || value === undefined) {
      return fallback;
    }
    
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (typeof value === 'object') {
      // Handle common object patterns
      if (value.name) return String(value.name);
      if (value.label) return String(value.label);
      if (value.title) return String(value.title);
      if (value.display) return String(value.display);
      
      // Fallback to JSON string for complex objects (in development)
      if (process.env.NODE_ENV === 'development') {
        return JSON.stringify(value);
      }
      
      return fallback;
    }
    
    return String(value);
  };

  return <span className={className}>{renderValue()}</span>;
};

/**
 * Hook to safely convert any value to a string for rendering
 */
export const useSafeString = (value: any, fallback: string = 'N/A'): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    // Handle common object patterns
    if (value.name) return String(value.name);
    if (value.label) return String(value.label);
    if (value.title) return String(value.title);
    if (value.display) return String(value.display);
    
    // Fallback to JSON string for complex objects (in development)
    if (process.env.NODE_ENV === 'development') {
      return JSON.stringify(value);
    }
    
    return fallback;
  }
  
  return String(value);
};

export default SafeRender;