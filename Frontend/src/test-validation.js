// Test script to validate Zod schemas
import { 
  validatePersonalInfoStep, 
  validateEmploymentStep, 
  validateFinancialStep, 
  validateCompleteForm 
} from './schemas/validationSchemas.js';

console.log('🧪 Testing Zod Validation Schemas\n');

// Test 1: Valid Personal Info
console.log('📋 Test 1: Valid Personal Information');
const validPersonalInfo = {
  firstName: 'John',
  lastName: 'Doe',
  dob: '1990-01-01',
  nationalIDNumber: 'GHA-123456789-1',
  gender: 'male',
  maritalStatus: 'single',
  phone: '0202123456',
  email: 'john.doe@example.com',
  residentialAddress: '123 Main Street, East Legon',
  city: 'Accra',
  region: 'Greater Accra'
};

const personalResult = validatePersonalInfoStep(validPersonalInfo);
console.log('Result:', personalResult.isValid ? '✅ VALID' : '❌ INVALID');
if (!personalResult.isValid) {
  console.log('Errors:', Object.keys(personalResult.errors));
}
console.log();

// Test 2: Invalid Personal Info (test validation rules)
console.log('📋 Test 2: Invalid Personal Information');
const invalidPersonalInfo = {
  firstName: 'J', // Too short
  lastName: '',   // Required field missing
  dob: '2010-01-01', // Too young
  nationalIDNumber: 'INVALID-ID', // Wrong format
  gender: 'invalid', // Invalid option
  maritalStatus: 'single',
  phone: '123', // Invalid Ghana phone format
  email: 'invalid-email', // Invalid email
  residentialAddress: 'Short', // Too short
  city: '',      // Required field missing
  region: 'Greater Accra'
};

const invalidPersonalResult = validatePersonalInfoStep(invalidPersonalInfo);
console.log('Result:', invalidPersonalResult.isValid ? '✅ VALID' : '❌ INVALID');
if (!invalidPersonalResult.isValid) {
  console.log('Errors detected:');
  Object.entries(invalidPersonalResult.errors).forEach(([field, error]) => {
    console.log(`  - ${field}: ${error.message}`);
  });
}
console.log();

// Test 3: Valid Employment Info
console.log('💼 Test 3: Valid Employment Information');
const validEmployment = {
  employmentStatus: 'employed',
  jobTitle: 'Software Engineer',
  employmentLength: '3 years'
};

const employmentResult = validateEmploymentStep(validEmployment);
console.log('Result:', employmentResult.isValid ? '✅ VALID' : '❌ INVALID');
if (!employmentResult.isValid) {
  console.log('Errors:', Object.keys(employmentResult.errors));
}
console.log();

// Test 4: Valid Financial Info
console.log('💰 Test 4: Valid Financial Information');
const validFinancial = {
  annualIncome: 50000,
  loanAmount: 10000,
  interestRate: 12.5,
  dti: 30,
  creditHistoryLength: 5,
  totalAccounts: 3,
  homeOwnership: 'RENT'
};

const financialResult = validateFinancialStep(validFinancial);
console.log('Result:', financialResult.isValid ? '✅ VALID' : '❌ INVALID');
if (!financialResult.isValid) {
  console.log('Errors:', Object.keys(financialResult.errors));
}
console.log();

// Test 5: Invalid Financial Info (test limits and constraints)
console.log('💰 Test 5: Invalid Financial Information');
const invalidFinancial = {
  annualIncome: -1000, // Negative income
  loanAmount: 50, // Below minimum
  interestRate: 150, // Too high
  dti: 150, // Above 100%
  creditHistoryLength: -1, // Negative
  totalAccounts: -5, // Negative
  homeOwnership: 'INVALID' // Invalid option
};

const invalidFinancialResult = validateFinancialStep(invalidFinancial);
console.log('Result:', invalidFinancialResult.isValid ? '✅ VALID' : '❌ INVALID');
if (!invalidFinancialResult.isValid) {
  console.log('Errors detected:');
  Object.entries(invalidFinancialResult.errors).forEach(([field, error]) => {
    console.log(`  - ${field}: ${error.message}`);
  });
}
console.log();

// Test 6: Complete Form Validation
console.log('📋 Test 6: Complete Form Validation');
const completeValidForm = {
  ...validPersonalInfo,
  ...validEmployment,
  ...validFinancial
};

const completeResult = validateCompleteForm(completeValidForm);
console.log('Result:', completeResult.isValid ? '✅ VALID' : '❌ INVALID');
if (!completeResult.isValid) {
  console.log('Errors:', Object.keys(completeResult.errors));
}
console.log();

console.log('🎉 Validation tests completed!');