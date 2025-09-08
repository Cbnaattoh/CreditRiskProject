// Comprehensive helper content for loan application form fields
export const FORM_HELPERS = {
  // Personal Information
  firstName: {
    tooltip: "Enter your first name exactly as it appears on your official documents (National ID, Passport). This will be used for identity verification.",
    helperText: "Enter your legal first name as shown on official documents",
    example: "John, Akosua, Kwame"
  },
  
  lastName: {
    tooltip: "Enter your family name or surname exactly as it appears on your official identification documents. This must match your ID for verification.",
    helperText: "Enter your legal surname/family name as shown on official documents",
    example: "Mensah, Asante, Osei"
  },
  
  otherNames: {
    tooltip: "Enter any middle names or additional names as they appear on your official documents. This field is optional but recommended for complete identification.",
    helperText: "Middle names or additional names (optional but recommended)",
    example: "Kwaku, Ama, Adjoa"
  },
  
  dob: {
    tooltip: "Select your date of birth as it appears on your official documents. You must be at least 18 years old to apply for a loan in Ghana.",
    helperText: "Must be 18 years or older to apply for a loan",
    example: "DD/MM/YYYY format"
  },
  
  nationalIDNumber: {
    tooltip: "Enter your Ghana National ID number in the format GHA-XXXXXXXXX-X. This is found on your Ghana Card and is used for identity verification and credit checks.",
    helperText: "Your Ghana Card number - required for identity verification",
    example: "GHA-123456789-1"
  },
  
  ssnitNumber: {
    tooltip: "Enter your Social Security and National Insurance Trust (SSNIT) number starting with 'P' followed by 10 digits. This helps verify your employment history and social security contributions.",
    helperText: "Your SSNIT number helps verify employment history (optional)",
    example: "P1234567890"
  },
  
  gender: {
    tooltip: "Select your gender as recorded on your official documents. This information is used for demographic analysis and regulatory compliance.",
    helperText: "Select your gender as it appears on official documents"
  },
  
  maritalStatus: {
    tooltip: "Select your current marital status. This affects your financial obligations and may influence loan terms and conditions.",
    helperText: "Your current marital status affects financial assessment"
  },
  
  // Contact Information
  phone: {
    tooltip: "Enter your active Ghana mobile number. Use format 0XXXXXXXXX or +233XXXXXXXXX. This number will be used for loan communications and verification.",
    helperText: "Your active Ghana mobile number for loan communications",
    example: "0202123456 or +233202123456"
  },
  
  alternatePhone: {
    tooltip: "Enter an alternative Ghana phone number for backup contact. This could be a family member or secondary phone number.",
    helperText: "Backup contact number (optional but recommended)",
    example: "0244987654"
  },
  
  email: {
    tooltip: "Enter your active email address. You'll receive loan updates, statements, and important communications via email. Ensure you can access this email regularly.",
    helperText: "Active email for loan communications and statements",
    example: "john.mensah@gmail.com"
  },
  
  residentialAddress: {
    tooltip: "Enter your complete current home address including house number, street name, and area. This should match your utility bills and be where you currently live.",
    helperText: "Your complete current home address including house number",
    example: "House No. C123/4, Spintex Road, East Legon"
  },
  
  digitalAddress: {
    tooltip: "Enter your Ghana Post GPS address (Digital Address) in format like GE-123-4567. Find this on your Ghana Post GPS app, utility bills, or by visiting gps.gov.gh.",
    helperText: "Your official Ghana Post GPS address",
    example: "GE-123-4567, GA-456-789"
  },
  
  city: {
    tooltip: "Enter the city or town where you currently reside. This is used for regional analysis and loan processing logistics.",
    helperText: "City or town where you currently live",
    example: "Accra, Kumasi, Tamale, Cape Coast"
  },
  
  region: {
    tooltip: "Select your region from Ghana's 16 administrative regions. This affects regional credit analysis and processing procedures.",
    helperText: "Select your region from Ghana's 16 administrative regions",
    example: "Greater Accra, Ashanti, Northern, Central"
  },
  
  landmark: {
    tooltip: "Describe a notable landmark near your home such as a school, church, or major business. This helps with address verification and emergency contact.",
    helperText: "Notable landmark near your address for easy identification",
    example: "Near SDA Church, Behind Shell Station, Opposite GCB Bank"
  },
  
  // Employment Information
  employmentStatus: {
    tooltip: "Select your current work situation. This significantly affects your loan eligibility, as employed individuals typically have more stable income streams.",
    helperText: "Your current work situation affects loan eligibility and terms"
  },
  
  jobTitle: {
    tooltip: "Select your specific job title from the list. In Ghana, certain jobs are considered more stable and may qualify for better loan terms. Government workers and professionals often get preferential rates.",
    helperText: "Your specific job title affects employment stability assessment in Ghana",
    example: "Teacher, Doctor, Bank Manager, Software Engineer"
  },
  
  employer: {
    tooltip: "Enter the full legal name of your employer or company. For self-employed individuals, enter your business name or 'Self-Employed'. This is verified during the application process.",
    helperText: "Full name of your employer or business",
    example: "Ghana Commercial Bank, University of Ghana, ABC Trading Ltd"
  },
  
  yearsEmployed: {
    tooltip: "Enter how long you've been with your current employer in years. Use decimals for partial years (e.g., 2.5 for 2 years 6 months). Longer employment shows stability.",
    helperText: "Duration with current employer - longer tenure shows stability",
    example: "2.5 (for 2 years, 6 months)"
  },
  
  monthlyIncome: {
    tooltip: "Enter your gross monthly income in Ghana Cedis before taxes and deductions. Include salary, allowances, and regular bonuses. This determines your loan repayment capacity.",
    helperText: "Gross monthly income including allowances and regular bonuses",
    example: "GHS 5,500.00 (salary + transport allowance)"
  },
  
  employmentStartDate: {
    tooltip: "Select when you started your current job. This helps verify your employment duration and income stability over time.",
    helperText: "When you started your current job - helps verify employment duration"
  },
  
  // Financial Information
  annualIncome: {
    tooltip: "Enter your total yearly gross income from all sources before taxes. This includes salary, business income, investments, and other regular earnings. Critical for loan amount determination.",
    helperText: "Total yearly gross income from all sources before taxes",
    example: "GHS 60,000 (equals GHS 5,000 per month)"
  },
  
  loanAmount: {
    tooltip: "Enter the amount you want to borrow in Ghana Cedis. Consider your repayment ability - typically shouldn't exceed 3-4 times your monthly income for personal loans.",
    helperText: "Amount you want to borrow - consider your repayment ability",
    example: "GHS 50,000 for business expansion or home improvement"
  },
  
  interestRate: {
    tooltip: "Enter the annual interest rate offered by your lender as a percentage. This significantly affects your monthly payments and total loan cost. Shop around for competitive rates.",
    helperText: "Annual interest rate affects monthly payments and total cost",
    example: "12.5% is typical for personal loans in Ghana"
  },
  
  dti: {
    tooltip: "Calculate your debt-to-income ratio: (Total monthly debt payments ÷ Monthly income) × 100. Lower ratios (below 40%) indicate better financial health and loan eligibility.",
    helperText: "Formula: (Monthly debt payments ÷ Monthly income) × 100",
    example: "30.25% means GHS 1,512.50 debt payments on GHS 5,000 income"
  },
  
  creditHistoryLength: {
    tooltip: "Enter how many years you've been using credit products like loans, credit cards, or hire purchase agreements. Longer credit history generally improves loan terms.",
    helperText: "Years using credit products - longer history improves loan terms",
    example: "5 years of using loans, credit cards, or hire purchase"
  },
  
  revolvingUtilization: {
    tooltip: "Calculate what percentage of your available credit limits you're currently using. Lower utilization (below 30%) shows good credit management and improves loan approval chances.",
    helperText: "Percentage of credit limits currently used - lower is better",
    example: "30% if you owe GHS 3,000 on GHS 10,000 credit limit"
  },
  
  maxBankcardBalance: {
    tooltip: "Enter the highest balance you've ever carried on any bankcard or credit card in Ghana Cedis. This shows your maximum credit usage and financial management patterns.",
    helperText: "Highest balance ever on any bankcard - shows credit usage patterns",
    example: "GHS 5,000 highest balance on credit card"
  },
  
  delinquencies2yr: {
    tooltip: "Count how many times you were 30+ days late on any loan or credit payments in the last 2 years. Zero delinquencies significantly improves your credit profile.",
    helperText: "Late payments (30+ days) in last 2 years - zero is ideal",
    example: "0 (no late payments shows reliability)"
  },
  
  totalAccounts: {
    tooltip: "Count all credit accounts you've ever had including current and closed loans, credit cards, hire purchase agreements, and mobile money credit. Shows your credit experience.",
    helperText: "All credit accounts ever held - shows credit experience breadth",
    example: "15 accounts (loans, credit cards, hire purchase, etc.)"
  },
  
  inquiries6mo: {
    tooltip: "Count how many times lenders checked your credit report in the last 6 months when you applied for credit. Too many inquiries (>6) may indicate credit seeking behavior.",
    helperText: "Credit report checks in last 6 months - too many indicates risk",
    example: "1-2 inquiries is normal when shopping for loans"
  },
  
  revolvingAccounts12mo: {
    tooltip: "Count credit cards or revolving credit accounts opened in the last 12 months. Opening too many new accounts quickly may indicate financial stress to lenders.",
    helperText: "New revolving credit accounts in last 12 months",
    example: "1 new credit card in the last year"
  },
  
  employmentLength: {
    tooltip: "Select how long you've been in your current employment. Longer employment tenure indicates job stability and consistent income, improving loan approval odds.",
    helperText: "Employment duration indicates job stability and income consistency"
  },
  
  publicRecords: {
    tooltip: "Count any public financial records such as bankruptcies, tax liens, court judgments, or other legal financial issues. Zero public records is strongly preferred by lenders.",
    helperText: "Public financial records (bankruptcies, liens, judgments) - zero preferred",
    example: "0 is ideal - public records seriously hurt loan approval"
  },
  
  openAccounts: {
    tooltip: "Count currently active credit accounts that you're still paying or using including loans, credit cards, and hire purchase agreements. Shows current credit obligations.",
    helperText: "Currently active credit accounts you're still paying or using",
    example: "8 accounts (2 loans, 3 credit cards, 3 hire purchase)"
  },
  
  homeOwnership: {
    tooltip: "Select your current housing situation. Homeowners often get better loan terms as property serves as collateral security, while renters may need additional guarantees.",
    helperText: "Housing situation affects loan terms and security requirements"
  },
  
  collections12mo: {
    tooltip: "Count accounts sent to debt collection agencies in the last 12 months excluding medical bills. Collections seriously damage credit scores and loan eligibility.",
    helperText: "Accounts in collections (excluding medical) - seriously hurts credit",
    example: "0 is strongly preferred by all lenders"
  },
  
  // Additional Financial Details
  totalAssets: {
    tooltip: "Calculate the total value of everything you own including property, vehicles, bank accounts, investments, and other valuable items. Assets can serve as loan security.",
    helperText: "Total value of everything you own - can serve as loan security",
    example: "House GHS 80,000 + Car GHS 15,000 + Savings GHS 5,000 = GHS 100,000"
  },
  
  totalLiabilities: {
    tooltip: "Calculate the total amount you owe on all debts including mortgages, car loans, credit cards, and other borrowed money. This affects your debt-to-income ratio.",
    helperText: "Total amount owed on all debts and borrowed money",
    example: "Mortgage GHS 40,000 + Car loan GHS 8,000 + Credit cards GHS 2,000 = GHS 50,000"
  },
  
  monthlyExpenses: {
    tooltip: "Calculate your total monthly spending on all necessities and lifestyle expenses including rent, food, utilities, transport, insurance, and entertainment.",
    helperText: "Total monthly spending on all necessities and lifestyle expenses",
    example: "Rent GHS 1,200 + Food GHS 800 + Utilities GHS 300 + Transport GHS 400 + Other GHS 300 = GHS 3,000"
  },
  
  hasBankruptcy: {
    tooltip: "Indicate whether you have ever legally declared bankruptcy or insolvency. Bankruptcy significantly affects creditworthiness, but honesty is required as this is verifiable.",
    helperText: "Legal bankruptcy/insolvency declaration - be honest as this is verifiable",
    example: "Most applicants select 'No' - only select 'Yes' if legally declared"
  }
} as const;

// Helper function to get field helpers
export const getFieldHelper = (fieldName: keyof typeof FORM_HELPERS) => {
  return FORM_HELPERS[fieldName] || null;
};

// Function to get all fields with helpers
export const getAllFieldsWithHelpers = () => {
  return Object.keys(FORM_HELPERS) as Array<keyof typeof FORM_HELPERS>;
};