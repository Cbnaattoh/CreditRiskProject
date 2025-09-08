import type { HelperSection } from '../components/common/EnhancedHelperContent';

// Enhanced helper content with better formatting and structure
export const ENHANCED_FORM_HELPERS = {
  // Personal Information
  firstName: {
    title: "First Name Guidelines",
    sections: [
      {
        title: "Identity Verification",
        content: "Enter your first name exactly as it appears on your official documents.",
        type: "info" as const,
        bullets: [
          "Must match your National ID or Passport exactly",
          "Include any special characters or accents",
          "No nicknames or abbreviated versions"
        ],
        example: "If your ID shows 'Akosua' don't enter 'Akos' or 'Akosua-Adjoa'",
        tip: "Double-check spelling against your Ghana Card to avoid verification delays"
      }
    ]
  },

  lastName: {
    title: "Last Name Requirements",
    sections: [
      {
        title: "Family Name Verification",
        content: "Enter your family name or surname as shown on official identification.",
        type: "info" as const,
        bullets: [
          "Must match National ID exactly",
          "Include all parts if hyphenated",
          "Maintain original spelling and capitalization"
        ],
        example: "For 'Asante-Mensah' enter the full name, not just 'Asante'",
        tip: "Married names should match your current legal documents"
      }
    ]
  },

  dob: {
    title: "Date of Birth Information",
    sections: [
      {
        title: "Age Requirements",
        content: "You must be at least 18 years old to apply for a loan in Ghana.",
        type: "warning" as const,
        bullets: [
          "Must match your official documents",
          "Minimum age: 18 years",
          "Maximum age: 65 years for most loan products"
        ],
        tip: "Use the date format exactly as shown on your Ghana Card"
      }
    ]
  },

  nationalIDNumber: {
    title: "Ghana National ID Number",
    sections: [
      {
        title: "Format Requirements",
        content: "Enter your Ghana Card number in the correct format for identity verification.",
        type: "guide" as const,
        bullets: [
          "Format: GHA-XXXXXXXXX-X",
          "Found on your Ghana Card",
          "Used for credit checks and verification"
        ],
        example: "GHA-123456789-1 (always starts with 'GHA-')",
        tip: "This number is unique to you and cannot be changed"
      }
    ]
  },

  annualIncome: {
    title: "Annual Income Calculation",
    sections: [
      {
        title: "What to Include",
        content: "Enter your total yearly gross income from all sources before taxes.",
        type: "info" as const,
        bullets: [
          "Base salary or wages",
          "Bonuses and commissions",
          "Business income",
          "Investment returns",
          "Rental income"
        ],
        formula: "Monthly Income × 12 = Annual Income",
        example: "GHS 5,000/month × 12 = GHS 60,000 annual income",
        tip: "Higher income increases your loan approval chances and limits"
      }
    ]
  },

  dti: {
    title: "Debt-to-Income Ratio (%)",
    sections: [
      {
        title: "Understanding DTI Percentage",
        content: "This critical ratio shows what percentage of your monthly income goes toward debt payments. It's one of the most important factors lenders use to assess your ability to manage additional debt.",
        type: "guide" as const,
        formula: "(Total Monthly Debt Payments ÷ Monthly Gross Income) × 100",
        bullets: [
          "Include all loan payments (personal, auto, mortgage)",
          "Include minimum credit card payments",
          "Include hire purchase agreements",
          "Include microfinance loan payments",
          "Don't include utilities, rent, or living expenses"
        ],
        example: "Monthly debts: GHS 1,500 ÷ Monthly income: GHS 5,000 = 30%"
      },
      {
        title: "DTI Impact on Loan Approval",
        content: "Lenders use DTI as a primary indicator of financial stress and repayment ability.",
        type: "info" as const,
        bullets: [
          "Excellent (0-19%): Highest approval rates, best interest rates",
          "Good (20-35%): Strong approval chances, competitive rates", 
          "Fair (36-42%): May require additional documentation",
          "Poor (43%+): Likely rejection or very high interest rates"
        ],
        tip: "Most Ghanaian lenders prefer DTI below 40% for personal loans"
      },
      {
        title: "How to Improve Your DTI",
        content: "Strategic steps to lower your debt-to-income ratio before applying.",
        type: "success" as const,
        bullets: [
          "Pay down existing credit card balances",
          "Consolidate high-interest debts",
          "Increase your monthly income through side work",
          "Avoid taking on new debt before applying",
          "Consider paying off smaller loans completely"
        ],
        tip: "Even a 5% improvement in DTI can significantly boost your approval odds"
      }
    ]
  },

  creditHistoryLength: {
    title: "Credit History Length (Years)",
    sections: [
      {
        title: "What Counts as Credit History",
        content: "Enter the total number of years you have been using any form of credit products. This measures your experience managing borrowed money over time.",
        type: "info" as const,
        bullets: [
          "Bank loans (personal, auto, mortgage, business)",
          "Credit cards and overdraft facilities",
          "Hire purchase agreements (appliances, furniture)",
          "Mobile money credit services (MTN MoMo, Airtel Money)",
          "Microfinance institution loans",
          "Susu group lending arrangements",
          "Employer salary advances or loans"
        ],
        example: "First got a loan in 2019, now 2024 = enter '5 years'",
        tip: "Start counting from your very first credit product, even if it was small"
      },
      {
        title: "Impact on Loan Terms",
        content: "Longer credit history demonstrates experience and typically results in better loan offers.",
        type: "guide" as const,
        bullets: [
          "0-2 years: Limited history, may need guarantor or collateral",
          "3-5 years: Good foundation, standard loan terms",
          "6-10 years: Strong history, competitive rates available",
          "10+ years: Excellent history, premium rates and terms"
        ],
        tip: "Quality matters more than quantity - consistent payments over shorter time beats missed payments over longer time"
      },
      {
        title: "New to Credit in Ghana?",
        content: "First-time borrowers still have options to build and demonstrate creditworthiness.",
        type: "success" as const,
        bullets: [
          "Enter '0' if completely new to formal credit",
          "Some lenders specialize in 'thin file' applicants",
          "Consider starting with secured credit cards",
          "Mobile money lending can help establish history",
          "Utility payments and rent history may be considered"
        ],
        tip: "Building credit history takes time, but starting with smaller amounts and consistent payments creates a strong foundation"
      }
    ]
  },

  revolvingUtilization: {
    title: "Credit Utilization Ratio",
    sections: [
      {
        title: "How to Calculate",
        content: "This shows how much of your available credit you're currently using.",
        type: "guide" as const,
        formula: "(Current Balances ÷ Credit Limits) × 100",
        bullets: [
          "Add up all credit card balances",
          "Add up all credit limits",
          "Calculate the percentage"
        ],
        example: "GHS 3,000 owed ÷ GHS 10,000 limits = 30% utilization"
      },
      {
        title: "Optimal Ranges",
        content: "Lower utilization shows better credit management.",
        type: "success" as const,
        bullets: [
          "Excellent: 0-10%",
          "Good: 11-30%",
          "Fair: 31-50%",
          "Poor: Above 50%"
        ],
        tip: "Keep utilization below 30% for best credit scores"
      }
    ]
  },

  delinquencies2yr: {
    title: "Number of Delinquencies in Past 2 Years",
    sections: [
      {
        title: "What Counts as a Delinquency",
        content: "Enter the total number of times you have been 30 or more days late on any payment in the last 24 months. This is a critical indicator of payment reliability.",
        type: "warning" as const,
        bullets: [
          "Bank loan payments 30+ days late",
          "Credit card minimum payments 30+ days late",
          "Hire purchase agreement payments 30+ days late",
          "Microfinance loan payments 30+ days late",
          "Mobile money loan payments 30+ days late",
          "Don't count payments only 1-29 days late",
          "Count each separate occurrence as one delinquency"
        ],
        example: "Late on car loan twice + late on credit card once = enter '3'",
        tip: "Even one day past 30 days counts as a delinquency - be precise"
      },
      {
        title: "Severe Impact on Loan Approval",
        content: "Recent payment delinquencies are among the strongest predictors of future payment problems.",
        type: "warning" as const,
        bullets: [
          "0 delinquencies: Excellent payment history, best rates",
          "1 delinquency: May be acceptable with good explanation",
          "2-3 delinquencies: Significant concern, higher rates",
          "4+ delinquencies: Very likely loan denial or subprime rates"
        ],
        tip: "Lenders in Ghana take payment history very seriously - be completely honest as this will be verified"
      },
      {
        title: "What If You Have Delinquencies?",
        content: "Steps to take if you have recent late payments to improve your application.",
        type: "guide" as const,
        bullets: [
          "Prepare detailed explanations for each delinquency",
          "Show evidence of improved payment patterns since",
          "Consider waiting 6-12 months to improve your record",
          "Bring documentation of any extenuating circumstances",
          "Consider applying with a co-signer or guarantor"
        ],
        tip: "One-time events (medical emergency, job loss) with subsequent good payment history are viewed more favorably than patterns of lateness"
      }
    ]
  },

  employmentLength: {
    title: "Employment Length",
    sections: [
      {
        title: "How Employment Length Affects Loans",
        content: "Select how long you have been with your current employer or in your current business. Employment stability is a key factor in loan approval and interest rates.",
        type: "info" as const,
        bullets: [
          "Less than 1 year: May need additional documentation",
          "1-2 years: Acceptable for most loan products", 
          "3-5 years: Strong stability indicator",
          "5-10 years: Excellent employment history",
          "10+ years: Premium stability, best loan terms"
        ],
        example: "If you started your current job in January 2022, select '2-3 years'",
        tip: "Count only time with your current employer - job changes within the same company count as continuous employment"
      },
      {
        title: "What Counts as Employment Length",
        content: "Guidelines for calculating your employment duration accurately.",
        type: "guide" as const,
        bullets: [
          "Use your official start date with current employer",
          "Include time through promotions within same company",
          "Include approved leave periods (maternity, medical)",
          "Don't include gaps between different employers",
          "For contractors: use continuous contract period with same client"
        ],
        tip: "Bring employment letter or contract showing start date for verification"
      },
      {
        title: "Self-Employed & Business Owners",
        content: "Special considerations for those who work for themselves.",
        type: "success" as const,
        bullets: [
          "Count years since business registration or first income",
          "Minimum 2 years in business preferred by most lenders",
          "Prepare business registration documents",
          "May need 2-3 years of audited financial statements",
          "Consider seasonal variations in income"
        ],
        tip: "Self-employed applicants should emphasize business stability and consistent income patterns"
      },
      {
        title: "Recently Changed Jobs?",
        content: "What to do if you've recently started a new position.",
        type: "warning" as const,
        bullets: [
          "Less than 3 months: Consider waiting before applying",
          "3-6 months: Provide offer letter and pay stubs",
          "6-12 months: Should be acceptable for most lenders",
          "Job changes within same industry are viewed favorably",
          "Promotions or career advancement are positive factors"
        ],
        tip: "Recent job changes for higher salary or better position are generally viewed positively by lenders"
      }
    ]
  },

  homeOwnership: {
    title: "Home Ownership Status",
    sections: [
      {
        title: "How Home Ownership Affects Your Loan",
        content: "Your housing situation significantly impacts loan approval, interest rates, and collateral requirements. Lenders view housing stability as an indicator of overall financial responsibility.",
        type: "info" as const,
        bullets: [
          "Own outright: Best rates, can use property as collateral",
          "Mortgage: Good stability indicator, competitive rates",
          "Rent: Standard rates, may need additional verification", 
          "Other (family/free): May require additional documentation"
        ],
        example: "If you own your house with no mortgage, select 'Own'",
        tip: "Homeowners typically qualify for larger loan amounts due to asset backing"
      },
      {
        title: "Selecting the Correct Option",
        content: "Choose the option that accurately describes your current living situation.",
        type: "guide" as const,
        bullets: [
          "Own: You hold clear title/deed with no mortgage payments",
          "Mortgage: You're currently paying a home loan",
          "Rent: You pay monthly rent to a landlord",
          "Other: Living with family, caretaker arrangements, etc."
        ],
        tip: "Your selection should match your utility bills and official address documents"
      },
      {
        title: "Documentation You May Need",
        content: "Be prepared to verify your housing status during the loan process.",
        type: "warning" as const,
        bullets: [
          "Own: Land title, property registration documents",
          "Mortgage: Recent mortgage statement, loan agreement",
          "Rent: Rental agreement, recent rent receipts",
          "Other: Letter from property owner, utility bills in your name"
        ],
        tip: "Consistent address history for 2+ years shows stability and improves loan terms"
      },
      {
        title: "Ghana-Specific Considerations",
        content: "Special factors relevant to home ownership in Ghana.",
        type: "success" as const,
        bullets: [
          "Family land without formal title still counts as ownership",
          "Customary land ownership is recognized by many lenders",
          "Joint family property may require additional documentation",
          "Government housing schemes (Affordable Housing) are viewed favorably"
        ],
        tip: "Even informal ownership arrangements can strengthen your loan application if properly documented"
      }
    ]
  },

  collections12mo: {
    title: "Collections Account",
    sections: [
      {
        title: "Serious Credit Impact",
        content: "Accounts sent to collection agencies seriously damage credit scores.",
        type: "warning" as const,
        bullets: [
          "Don't include medical collections",
          "Only count non-medical debt collections",
          "Count each account separately"
        ],
        example: "2 different accounts sent to collections = enter '2'"
      },
      {
        title: "Recovery Steps",
        content: "If you have collections, take action before applying.",
        type: "tip" as const,
        bullets: [
          "Contact collection agencies to arrange payment",
          "Get payment agreements in writing",
          "Consider debt settlement if needed"
        ],
        tip: "Zero collections is strongly preferred by all lenders"
      }
    ]
  },

  // Employment fields
  employmentStatus: {
    title: "Employment Status Guidelines",
    sections: [
      {
        title: "Choose Your Current Status",
        content: "Select the option that best describes your current employment situation.",
        type: "info" as const,
        bullets: [
          "Employed (Full-Time): Working 35+ hours per week",
          "Self-Employed: Running your own business",
          "Unemployed: Currently not working",
          "Retired: No longer working due to age"
        ],
        example: "If you work 40 hours/week for a company, select 'Employed (Full-Time)'",
        tip: "Stable employment history improves loan approval chances"
      }
    ]
  },

  jobTitle: {
    title: "Job Title Selection",
    sections: [
      {
        title: "Industry Classification",
        content: "Select your job title that best matches your current role for Ghana employment analysis.",
        type: "info" as const,
        bullets: [
          "Choose the closest match to your actual job",
          "This affects income stability assessment",
          "Different industries have different risk profiles"
        ],
        example: "Software developers should select 'Software Developer', not 'Engineer'",
        tip: "Accurate job titles help with proper risk assessment"
      }
    ]
  },

  employer: {
    title: "Company Information",
    sections: [
      {
        title: "Employer Details",
        content: "Enter your current employer's official company name exactly as registered.",
        type: "info" as const,
        bullets: [
          "Use the full legal business name",
          "Include 'Ltd', 'Inc', or other suffixes",
          "For government jobs, specify the ministry/agency"
        ],
        example: "ABC Manufacturing Company Ltd (not just 'ABC Company')",
        tip: "Accurate employer info helps verify employment and income"
      }
    ]
  },

  yearsEmployed: {
    title: "Employment Duration",
    sections: [
      {
        title: "Current Job Tenure",
        content: "Enter how long you have been working at your current job in years.",
        type: "info" as const,
        bullets: [
          "Count only time with current employer",
          "Use decimal format for partial years",
          "Include promotions at same company"
        ],
        formula: "Months ÷ 12 = Years",
        example: "18 months = 1.5 years, 30 months = 2.5 years",
        tip: "Longer employment shows stability and improves approval odds"
      }
    ]
  },

  monthlyIncome: {
    title: "Monthly Income Calculation",
    sections: [
      {
        title: "Gross Monthly Income",
        content: "Enter your total monthly income before taxes and deductions.",
        type: "info" as const,
        bullets: [
          "Include base salary",
          "Add regular bonuses and allowances",
          "Include overtime if consistent",
          "For self-employed: average monthly profit"
        ],
        formula: "Annual Income ÷ 12 = Monthly Income",
        example: "GHS 60,000 annual salary = GHS 5,000 monthly income",
        tip: "Higher stable income increases loan limits and approval chances"
      }
    ]
  },

  employmentStartDate: {
    title: "Employment Start Date",
    sections: [
      {
        title: "Job Commencement",
        content: "Enter the date you started working at your current job.",
        type: "info" as const,
        bullets: [
          "Use the official start date from your contract",
          "For promotions, use original hire date",
          "Must be consistent with years employed"
        ],
        example: "If you started January 15, 2022, enter 2022-01-15",
        tip: "This validates your employment duration and stability"
      }
    ]
  },

  // Contact and personal fields
  otherNames: {
    title: "Middle Names/Other Names",
    sections: [
      {
        title: "Additional Names",
        content: "Enter any middle names or other names as they appear on your ID.",
        type: "info" as const,
        bullets: [
          "Include all middle names",
          "Match your official documents exactly",
          "Leave blank if you have no middle names"
        ],
        example: "If your ID shows 'John Michael Doe', enter 'Michael'",
        tip: "This helps with identity verification processes"
      }
    ]
  },

  ssnitNumber: {
    title: "SSNIT Number Guidelines",
    sections: [
      {
        title: "Social Security Number",
        content: "Your Social Security and National Insurance Trust number for Ghana.",
        type: "info" as const,
        bullets: [
          "Format: PXXXXXXXXXX (P followed by 11 digits)",
          "Found on your SSNIT card or payslip",
          "Required for employment verification"
        ],
        example: "P12345678901",
        tip: "This number verifies your employment and contribution history"
      }
    ]
  },

  gender: {
    title: "Gender Information",
    sections: [
      {
        title: "Gender Selection",
        content: "Select your gender as it appears on your official identification.",
        type: "info" as const,
        bullets: [
          "Must match your ID documents",
          "Used for identification verification",
          "Required for regulatory compliance"
        ],
        tip: "This information is kept confidential and secure"
      }
    ]
  },

  maritalStatus: {
    title: "Marital Status",
    sections: [
      {
        title: "Current Status",
        content: "Select your current legal marital status.",
        type: "info" as const,
        bullets: [
          "Single: Never married",
          "Married: Legally married",
          "Divorced: Legally divorced",
          "Widowed: Spouse is deceased"
        ],
        example: "If legally married, select 'Married' even if separated",
        tip: "This may affect your financial obligations and income assessment"
      }
    ]
  },

  phone: {
    title: "Phone Number Guidelines",
    sections: [
      {
        title: "Contact Information",
        content: "Enter your primary mobile phone number for loan communications.",
        type: "info" as const,
        bullets: [
          "Use Ghana mobile format: 0XXXXXXXXX",
          "Must be your personal number",
          "Should be reachable during business hours"
        ],
        example: "0244123456 or 0202345678",
        tip: "We'll use this number for loan updates and verification calls"
      }
    ]
  },

  email: {
    title: "Email Address",
    sections: [
      {
        title: "Primary Email",
        content: "Enter your active email address for loan correspondence.",
        type: "info" as const,
        bullets: [
          "Must be your personal email",
          "Check spelling carefully",
          "Ensure you can receive emails"
        ],
        example: "john.doe@gmail.com",
        tip: "All loan documents and updates will be sent to this email"
      }
    ]
  },

  residentialAddress: {
    title: "Residential Address",
    sections: [
      {
        title: "Home Address",
        content: "Enter your complete current residential address.",
        type: "info" as const,
        bullets: [
          "Include house number and street name",
          "Add area/suburb name",
          "Mention city/town"
        ],
        example: "House No. 15, Osu Street, East Legon, Accra",
        tip: "This address will be verified and used for loan documentation"
      }
    ]
  },

  digitalAddress: {
    title: "Ghana Digital Address",
    sections: [
      {
        title: "Digital Postal Code",
        content: "Enter your Ghana Post digital address if available.",
        type: "info" as const,
        bullets: [
          "Format: Two letters + dash + numbers + dash + numbers",
          "Optional but helpful for verification",
          "Can be found using Ghana Post app"
        ],
        example: "GE-3445-345 or GA-456-7890",
        tip: "Digital addresses help with precise location verification"
      }
    ]
  },

  landmark: {
    title: "Nearby Landmark",
    sections: [
      {
        title: "Location Reference",
        content: "Mention a well-known landmark near your residence.",
        type: "info" as const,
        bullets: [
          "Use popular/well-known places",
          "Include churches, schools, or markets",
          "Help with address verification"
        ],
        example: "Near Legon University, Behind Accra Mall, Close to Tema Station",
        tip: "Landmarks help our team locate your address for verification"
      }
    ]
  },

  loanAmount: {
    title: "Loan Amount Guidelines",
    sections: [
      {
        title: "Requested Amount",
        content: "Enter the total loan amount you need in Ghana Cedis.",
        type: "info" as const,
        bullets: [
          "Minimum: GHS 1,000",
          "Consider your repayment capacity",
          "Based on your income and expenses"
        ],
        formula: "Monthly Income × 40% = Safe loan payment",
        example: "For GHS 5,000 monthly income, max safe payment = GHS 2,000",
        tip: "Lower amounts relative to income have better approval chances"
      }
    ]
  },

  interestRate: {
    title: "Interest Rate Information",
    sections: [
      {
        title: "Annual Percentage Rate",
        content: "The yearly interest rate offered by your preferred lender.",
        type: "info" as const,
        bullets: [
          "Check with multiple lenders",
          "Rates vary by risk profile",
          "Lower rates save money long-term"
        ],
        example: "12.5% means you pay 12.5% annually on outstanding balance",
        tip: "Good credit history can help you qualify for better rates"
      }
    ]
  },

  // Additional Financial Fields

  maxBankcardBalance: {
    title: "Maximum Bankcard Balance",
    sections: [
      {
        title: "Highest Balance Ever",
        content: "Enter the highest balance you've ever had on any bankcard or credit card.",
        type: "info" as const,
        bullets: [
          "Include all types of credit cards",
          "Consider bankcards from all institutions",
          "This shows your credit usage patterns",
          "Helps assess financial management skills"
        ],
        example: "If your highest ever balance was GHS 5,000, enter '5000'",
        tip: "This metric helps lenders understand your credit management history"
      }
    ]
  },

  totalAccounts: {
    title: "Total Number of Accounts",
    sections: [
      {
        title: "All Credit Accounts Ever",
        content: "Count all credit accounts you've ever had, including both current and closed accounts.",
        type: "info" as const,
        bullets: [
          "Bank loans (personal, auto, mortgage)",
          "Credit cards and overdrafts",
          "Hire purchase agreements",
          "Mobile money credit services",
          "Microfinance loans"
        ],
        example: "5 loans + 3 credit cards + 2 hire purchase = 10 total accounts",
        tip: "More accounts can show credit experience, but manage them responsibly"
      }
    ]
  },

  inquiries6mo: {
    title: "Recent Credit Inquiries",
    sections: [
      {
        title: "Credit Report Checks",
        content: "Count how many times lenders checked your credit report in the last 6 months.",
        type: "warning" as const,
        bullets: [
          "Only count 'hard' inquiries from loan applications",
          "Don't count personal credit report checks",
          "Multiple inquiries for same loan type count as one",
          "Too many inquiries indicate credit seeking"
        ],
        example: "Applied for 2 loans in 6 months = enter '2'",
        tip: "Limit new credit applications before applying for major loans"
      }
    ]
  },

  revolvingAccounts12mo: {
    title: "New Revolving Accounts",
    sections: [
      {
        title: "Recently Opened Credit Cards",
        content: "Count credit cards or revolving credit accounts opened in the last 12 months.",
        type: "guide" as const,
        bullets: [
          "Include all types of credit cards",
          "Include overdraft facilities",
          "Include mobile money credit lines",
          "Don't include fixed-term loans"
        ],
        example: "Opened 1 new credit card this year = enter '1'",
        tip: "Opening too many new accounts quickly can indicate financial stress"
      }
    ]
  },

  publicRecords: {
    title: "Public Financial Records",
    sections: [
      {
        title: "Legal Financial Issues",
        content: "Count any public records such as bankruptcies, liens, or court judgments.",
        type: "warning" as const,
        bullets: [
          "Bankruptcy filings",
          "Tax liens",
          "Court judgments",
          "Other public financial records"
        ],
        example: "No public records = enter '0'",
        tip: "Zero public records is strongly preferred by all lenders"
      }
    ]
  },

  openAccounts: {
    title: "Currently Active Accounts",
    sections: [
      {
        title: "Active Credit Obligations",
        content: "Count credit accounts that are currently active and you're still paying or using.",
        type: "info" as const,
        bullets: [
          "Current loans being repaid",
          "Active credit cards (even if zero balance)",
          "Current hire purchase agreements",
          "Don't count closed/paid-off accounts"
        ],
        example: "2 active loans + 3 credit cards + 1 hire purchase = 6 accounts",
        tip: "Shows your current credit management responsibilities"
      }
    ]
  },

  totalAssets: {
    title: "Total Asset Valuation",
    sections: [
      {
        title: "Everything You Own",
        content: "Calculate the total current value of all your assets and possessions.",
        type: "success" as const,
        bullets: [
          "Real estate (current market value)",
          "Vehicles (current market value)",
          "Bank accounts and savings",
          "Investments and stocks",
          "Valuable personal property"
        ],
        example: "House GHS 80,000 + Car GHS 15,000 + Savings GHS 5,000 = GHS 100,000",
        tip: "Higher assets can improve loan terms and serve as collateral"
      }
    ]
  },

  totalLiabilities: {
    title: "Total Debt and Liabilities",
    sections: [
      {
        title: "Everything You Owe",
        content: "Calculate the total amount you currently owe on all debts and obligations.",
        type: "warning" as const,
        bullets: [
          "Outstanding mortgage balances",
          "Car loan balances",
          "Credit card balances",
          "Personal loans",
          "Other debts and obligations"
        ],
        example: "Mortgage GHS 40,000 + Car loan GHS 8,000 + Credit cards GHS 2,000 = GHS 50,000",
        tip: "Lower debt levels relative to assets show better financial health"
      }
    ]
  },

  monthlyExpenses: {
    title: "Monthly Living Expenses",
    sections: [
      {
        title: "Total Monthly Spending",
        content: "Calculate your total monthly expenses for all necessities and lifestyle costs.",
        type: "guide" as const,
        bullets: [
          "Housing costs (rent/mortgage)",
          "Food and groceries",
          "Utilities and phone bills",
          "Transportation costs",
          "Insurance premiums",
          "Entertainment and personal expenses"
        ],
        example: "Rent GHS 1,200 + Food GHS 800 + Utilities GHS 300 + Transport GHS 400 = GHS 2,700",
        tip: "Accurate expense tracking helps determine loan affordability"
      }
    ]
  },

  hasBankruptcy: {
    title: "Bankruptcy History",
    sections: [
      {
        title: "Legal Bankruptcy Declaration",
        content: "Indicate whether you have ever legally declared bankruptcy or insolvency.",
        type: "warning" as const,
        bullets: [
          "Only legal bankruptcy/insolvency counts",
          "Financial difficulties without legal filing don't count",
          "This information is verifiable through records",
          "Honesty is required and expected"
        ],
        example: "Most applicants select 'No' - only select 'Yes' if you've legally declared bankruptcy",
        tip: "Bankruptcy significantly affects creditworthiness, but some lenders work with post-bankruptcy applicants"
      }
    ]
  }
} as const;

// Helper function to get enhanced field helpers
export const getEnhancedFieldHelper = (fieldName: keyof typeof ENHANCED_FORM_HELPERS) => {
  return ENHANCED_FORM_HELPERS[fieldName] || null;
};

// Function to get all fields with enhanced helpers
export const getAllEnhancedFieldsWithHelpers = () => {
  return Object.keys(ENHANCED_FORM_HELPERS) as Array<keyof typeof ENHANCED_FORM_HELPERS>;
};