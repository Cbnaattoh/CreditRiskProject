import React from "react";
import ReviewStep from "./index";

// Test cases for different address formats
const testCases = {
  // Case 1: Structured address (new format)
  structuredAddress: {
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    phone: "+233 24 987 6543",
    addresses: [
      {
        address_type: "HOME",
        street_address: "456 Oak Avenue, Residential Area",
        city: "Accra",
        state_province: "Greater Accra Region",
        postal_code: "GA-123-4567",
        country: "Ghana",
        is_primary: true
      },
      {
        address_type: "WORK",
        street_address: "789 Business District",
        city: "Accra",
        state_province: "Greater Accra Region", 
        postal_code: "GA-456-7890",
        country: "Ghana",
        is_primary: false
      }
    ],
    jobTitle: "Financial Analyst",
    annualIncome: "75000",
    loanAmount: "30000"
  },

  // Case 2: Legacy string address (backward compatibility)
  stringAddress: {
    firstName: "Bob",
    lastName: "Smith",
    email: "bob@example.com", 
    phone: "+233 54 111 2233",
    address: "321 Legacy Street, Tamale, Northern Region, Ghana",
    jobTitle: "Teacher",
    annualIncome: "45000",
    loanAmount: "15000"
  },

  // Case 3: Mixed format (has both)
  mixedAddress: {
    firstName: "Carol",
    lastName: "Williams",
    email: "carol@example.com",
    phone: "+233 26 444 5566", 
    address: "Old format address string",
    addresses: [
      {
        address_type: "HOME",
        street_address: "999 New Format Street",
        city: "Kumasi",
        state_province: "Ashanti Region",
        postal_code: "AS-999-0000",
        country: "Ghana",
        is_primary: true
      }
    ],
    jobTitle: "Nurse",
    annualIncome: "55000",
    loanAmount: "25000"
  }
};

export default function AddressDisplayTest() {
  const [selectedCase, setSelectedCase] = React.useState<keyof typeof testCases>("structuredAddress");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Address Display Test Cases
          </h1>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedCase("structuredAddress")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCase === "structuredAddress"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Structured Address
            </button>
            <button
              onClick={() => setSelectedCase("stringAddress")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCase === "stringAddress"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              String Address (Legacy)
            </button>
            <button
              onClick={() => setSelectedCase("mixedAddress")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCase === "mixedAddress"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Mixed Format
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Current Test Case: {selectedCase}
            </h3>
            <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {JSON.stringify(testCases[selectedCase], null, 2)}
            </pre>
          </div>
        </div>

        <ReviewStep formValues={testCases[selectedCase]} />
      </div>
    </div>
  );
}