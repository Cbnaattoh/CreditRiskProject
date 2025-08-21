import React from 'react';
import Tooltip from '../common/Tooltip';
import { getFieldHelper } from '../../data/formHelpers';

// Demo component to showcase the enhanced tooltip system
export const TooltipDemo: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🎯 Enhanced Tooltip System Demo
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information Examples */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Personal Information Fields
          </h3>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="font-medium">First Name</span>
            <Tooltip 
              content={getFieldHelper('firstName')?.tooltip || "Sample tooltip"}
              type="help"
            />
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="font-medium">National ID Number</span>
            <Tooltip 
              content={getFieldHelper('nationalIDNumber')?.tooltip || "Sample tooltip"}
              type="help"
            />
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="font-medium">Phone Number</span>
            <Tooltip 
              content={getFieldHelper('phone')?.tooltip || "Sample tooltip"}
              type="help"
            />
          </div>
        </div>

        {/* Financial Information Examples */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Financial Information Fields
          </h3>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="font-medium">Annual Income</span>
            <Tooltip 
              content={getFieldHelper('annualIncome')?.tooltip || "Sample tooltip"}
              type="help"
            />
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="font-medium">Debt-to-Income Ratio</span>
            <Tooltip 
              content={getFieldHelper('dti')?.tooltip || "Sample tooltip"}
              type="help"
            />
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="font-medium">Credit History Length</span>
            <Tooltip 
              content={getFieldHelper('creditHistoryLength')?.tooltip || "Sample tooltip"}
              type="help"
            />
          </div>
        </div>
      </div>

      {/* Different Tooltip Types */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Tooltip Types & Positions
        </h3>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span>Info:</span>
            <Tooltip content="This is an info tooltip" type="info" />
          </div>
          
          <div className="flex items-center gap-2">
            <span>Help:</span>
            <Tooltip content="This is a help tooltip" type="help" />
          </div>
          
          <div className="flex items-center gap-2">
            <span>Warning:</span>
            <Tooltip content="This is a warning tooltip" type="warning" />
          </div>
          
          <div className="flex items-center gap-2">
            <span>Success:</span>
            <Tooltip content="This is a success tooltip" type="success" />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 How to Test:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Hover</strong> over the question mark icons to see tooltips</li>
          <li>• <strong>Click</strong> on mobile devices to toggle tooltips</li>
          <li>• Tooltips automatically <strong>reposition</strong> if they go off-screen</li>
          <li>• Each tooltip contains <strong>Ghana-specific guidance</strong></li>
          <li>• Content includes <strong>examples, formats, and practical advice</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default TooltipDemo;