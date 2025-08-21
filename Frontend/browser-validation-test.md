# 🧪 Browser Console Validation Test

Open your browser to `http://localhost:5174`, then open Developer Tools (F12) and paste these commands in the console to test the validation:

## Test Commands for Browser Console

```javascript
// Test 1: Import validation functions (if available in global scope)
console.log('🧪 Testing Zod Validation in Browser Console');

// Test 2: Create test data for personal info validation
const testPersonalInfo = {
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

console.log('✅ Valid Personal Info Test Data:', testPersonalInfo);

// Test 3: Create invalid test data
const invalidData = {
  firstName: 'J', // Too short
  lastName: '', // Empty
  dob: '2010-01-01', // Too young
  nationalIDNumber: 'INVALID', // Wrong format
  gender: 'invalid',
  maritalStatus: 'single',
  phone: '123', // Invalid format
  email: 'bad-email',
  residentialAddress: 'Short',
  city: '',
  region: 'Greater Accra'
};

console.log('❌ Invalid Test Data:', invalidData);

// Test 4: Test Ghana phone number validation manually
const ghanaPhoneRegex = /^(\+233|0)[2-9]\d{8}$/;

console.log('📱 Ghana Phone Validation Tests:');
console.log('0202123456:', ghanaPhoneRegex.test('0202123456')); // Should be true
console.log('+233202123456:', ghanaPhoneRegex.test('+233202123456')); // Should be true
console.log('123456:', ghanaPhoneRegex.test('123456')); // Should be false
console.log('0102123456:', ghanaPhoneRegex.test('0102123456')); // Should be false (starts with 01)

// Test 5: Test National ID validation
const nationalIdRegex = /^GHA-\d{9}-\d$/;

console.log('🆔 National ID Validation Tests:');
console.log('GHA-123456789-1:', nationalIdRegex.test('GHA-123456789-1')); // Should be true
console.log('GHA-12345678-1:', nationalIdRegex.test('GHA-12345678-1')); // Should be false (8 digits)
console.log('INVALID-ID:', nationalIdRegex.test('INVALID-ID')); // Should be false

// Test 6: Test email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

console.log('📧 Email Validation Tests:');
console.log('john@example.com:', emailRegex.test('john@example.com')); // Should be true
console.log('invalid-email:', emailRegex.test('invalid-email')); // Should be false
console.log('test@domain:', emailRegex.test('test@domain')); // Should be false

console.log('🎉 Basic validation regex tests completed!');
```

## Manual Form Testing Steps

1. **Navigate to the loan application form**
2. **Try entering invalid data** and see if validation errors appear
3. **Check the validation sidebar** for real-time updates
4. **Try to proceed to the next step** with invalid data (should be blocked)
5. **Fill valid data** and see success indicators

## What to Expect

- ✅ **Valid data**: Green indicators, smooth progression
- ❌ **Invalid data**: Red borders, error messages, blocked progression
- 🔄 **Real-time updates**: Validation status changes as you type
- 📱 **Ghana-specific validation**: Proper format enforcement for phone, ID, etc.

## Key Features Implemented

1. **Comprehensive Zod schemas** for all form fields
2. **Step-by-step validation** before allowing progression
3. **Real-time validation feedback** with toast notifications
4. **Ghana-specific format validation** (phone, National ID, SSNIT)
5. **Visual validation indicators** in sidebar
6. **Age validation** (18-100 years old)
7. **Financial constraints** (reasonable limits and ranges)
8. **Required field enforcement**
9. **Format validation** (email, phone, ID numbers)
10. **Integrated error handling** with user-friendly messages