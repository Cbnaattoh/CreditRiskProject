import { useCallback } from 'react';
import type { UseFormTrigger, FieldErrors } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  validatePersonalInfoStep, 
  validateEmploymentStep, 
  validateFinancialStep, 
  validateCompleteForm 
} from '../schemas/validationSchemas';

export type ValidationStep = 'personal' | 'employment' | 'financial' | 'complete';

interface UseFormValidationProps {
  trigger: UseFormTrigger<any>;
  errors: FieldErrors<any>;
}

export const useFormValidation = ({ trigger, errors }: UseFormValidationProps) => {
  // Validate specific form step
  const validateStep = useCallback(async (step: ValidationStep, data: any): Promise<boolean> => {
    let validationResult;
    
    switch (step) {
      case 'personal':
        validationResult = validatePersonalInfoStep(data);
        break;
      case 'employment':
        validationResult = validateEmploymentStep(data);
        break;
      case 'financial':
        validationResult = validateFinancialStep(data);
        break;
      case 'complete':
        validationResult = validateCompleteForm(data);
        break;
      default:
        return true;
    }
    
    // Trigger field-level validation
    await trigger();
    
    if (!validationResult.isValid) {
      // Show validation error messages
      const errorMessages = Object.entries(validationResult.errors);
      
      if (errorMessages.length > 0) {
        // Show first few errors to avoid overwhelming user
        const firstErrors = errorMessages.slice(0, 3);
        firstErrors.forEach(([field, error]) => {
          toast.error(`${field}: ${error.message}`, {
            duration: 4000,
            position: 'top-right',
          });
        });
        
        if (errorMessages.length > 3) {
          toast.error(`And ${errorMessages.length - 3} more validation errors...`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      }
      
      return false;
    }
    
    return true;
  }, [trigger]);
  
  // Get validation status for current form state
  const getValidationStatus = useCallback(() => {
    const hasErrors = Object.keys(errors).length > 0;
    const errorCount = Object.keys(errors).length;
    
    return {
      isValid: !hasErrors,
      errorCount,
      hasErrors,
    };
  }, [errors]);
  
  // Show real-time validation feedback
  const showValidationFeedback = useCallback((fieldName: string) => {
    const fieldError = errors[fieldName];
    
    if (fieldError?.message) {
      toast.error(`${fieldName}: ${fieldError.message}`, {
        duration: 3000,
        position: 'top-right',
      });
    }
  }, [errors]);
  
  // Validate specific fields
  const validateFields = useCallback(async (fieldNames: string[]): Promise<boolean> => {
    const result = await trigger(fieldNames);
    
    if (!result) {
      // Show errors for failed fields
      fieldNames.forEach(fieldName => {
        const fieldError = errors[fieldName];
        if (fieldError?.message) {
          toast.error(`${fieldName}: ${fieldError.message}`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      });
    }
    
    return result;
  }, [trigger, errors]);
  
  return {
    validateStep,
    validateFields,
    getValidationStatus,
    showValidationFeedback,
  };
};

// Helper function to get user-friendly field names
export const getFieldDisplayName = (fieldName: string): string => {
  const displayNames: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    otherNames: 'Other Names',
    dob: 'Date of Birth',
    nationalIDNumber: 'National ID Number',
    ssnitNumber: 'SSNIT Number',
    gender: 'Gender',
    maritalStatus: 'Marital Status',
    phone: 'Phone Number',
    alternatePhone: 'Alternate Phone',
    email: 'Email Address',
    residentialAddress: 'Residential Address',
    digitalAddress: 'Digital Address',
    region: 'Region',
    city: 'City',
    landmark: 'Landmark',
    postalCode: 'Postal Code',
    employmentStatus: 'Employment Status',
    occupation: 'Occupation',
    jobTitle: 'Job Title',
    employer: 'Employer',
    yearsEmployed: 'Years Employed',
    employmentLength: 'Employment Length',
    annualIncome: 'Annual Income',
    monthlyIncome: 'Monthly Income',
    loanAmount: 'Loan Amount',
    interestRate: 'Interest Rate',
    dti: 'Debt-to-Income Ratio',
    homeOwnership: 'Home Ownership',
    creditHistoryLength: 'Credit History Length',
    totalAccounts: 'Total Accounts',
    // Add more as needed
  };
  
  return displayNames[fieldName] || fieldName;
};

export default useFormValidation;