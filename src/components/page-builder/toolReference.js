// The free tools of uirefrence.html (#/tools, #/tool/<key>) plus the loan EMI calculator: the
// content used by "Create the reference tools" and as the start of a new tool page.
// `key` is the URL (/tool/<key>, as the homepage Free Tools block links), `calculator` the
// calculator type (CALCULATORS in the website's components/tax-alphonic/tools/toolDefaults.js).

export const TOOL_REFERENCE = [
  {
    key: 'income-tax-calculator', calculator: 'income-tax', icon: '🧮', order: '1',
    title: 'Income Tax Calculator', tag: 'Old vs new regime',
    description: 'Calculate your income tax under both the old and new regime and see which saves you more.',
    howItWorks: 'Enter your yearly income, choose whether it is salary or other income, your age group and the deductions you claim (80C, 80D and so on). The calculator works out the tax under both regimes, including the section 87A rebate, surcharge for high incomes and the 4% health and education cess, and shows which regime costs you less.\n\nThe new regime has lower slab rates and a higher standard deduction but allows almost no deductions; the old regime keeps deductions such as 80C, 80D and HRA. If your deductions are large, the old regime can still win.',
  },
  {
    key: 'gst-calculator', calculator: 'gst', icon: '🧾', order: '2',
    title: 'GST Calculator', tag: 'CGST / SGST / IGST',
    description: 'Add or remove GST from any amount and get the CGST, SGST and IGST split instantly.',
    howItWorks: 'Pick the GST rate and whether your amount is before GST (add GST) or already includes it (remove GST). For a sale within your state the tax is split equally into CGST and SGST; for a sale to another state the whole amount is IGST.\n\n**Example:** ₹10,000 at 18% within the state is ₹900 CGST + ₹900 SGST, ₹11,800 in total.',
  },
  {
    key: 'hsn-code-finder', calculator: 'hsn', icon: '🔢', order: '3',
    title: 'HSN Code Finder', tag: 'Find your product code',
    description: 'Search HSN codes and GST rates for common goods and services.',
    howItWorks: 'Type a product name or the first digits of a code. HSN (Harmonised System of Nomenclature) codes classify goods, and SAC codes classify services; your GST invoices must show them.\n\nThe exact code and rate can depend on the product\'s description, material or price, so check with our experts before you invoice.',
  },
  {
    key: 'hra-calculator', calculator: 'hra', icon: '🏠', order: '4',
    title: 'HRA Calculator', tag: 'Maximise exemption',
    description: 'Find out how much House Rent Allowance (HRA) is exempt from your income tax.',
    howItWorks: 'The tax-free part of your HRA is the lowest of three amounts: the HRA you actually receive, 50% of basic salary + DA in a metro city (40% elsewhere), and the rent you pay minus 10% of basic salary + DA. The rest of your HRA is taxable.\n\nHRA exemption is only available under the old tax regime.',
  },
  {
    key: 'sip-calculator', calculator: 'sip', icon: '📈', order: '5',
    title: 'SIP Calculator', tag: 'Plan your investments',
    description: 'See how much your monthly SIP investment can grow over time with compounding.',
    howItWorks: 'A Systematic Investment Plan invests a fixed amount every month. The calculator compounds each instalment monthly at your expected yearly return to estimate the value at the end of the period.\n\nReturns on mutual funds are not guaranteed: use a realistic rate and treat the result as an estimate.',
  },
  {
    key: 'gstin-search', calculator: 'gstin', icon: '🔍', order: '6',
    title: 'GSTIN Search', tag: 'Verify any GST number',
    description: 'Check any GSTIN: its format, check digit, state and the PAN it belongs to.',
    howItWorks: 'A GSTIN has 15 characters: a 2-digit state code, the 10-character PAN of the business, the registration number for that PAN in the state, the letter Z and a check digit. The tool checks the format and recalculates the check digit, so a mistyped or made-up number is caught at once.\n\nWhether a GSTIN is active, and the registered business name, are shown only on the official GST portal.',
  },
  {
    key: 'emi-calculator', calculator: 'emi', icon: '🏦', order: '7',
    title: 'EMI Calculator', tag: 'Plan your loan',
    description: 'Work out your monthly EMI, the total interest and the year-by-year repayment schedule of any loan.',
    howItWorks: 'Enter the loan amount, the yearly interest rate and the tenure. The EMI is calculated with the standard reducing-balance formula, so each payment covers that month\'s interest and repays part of the principal.\n\nOpen the year-by-year schedule to see how much principal and interest you pay each year and the balance left.',
  },
];

// The hub page (/tools).
export const TOOLS_HUB = {
  key: 'tools',
  title: 'Free tools & calculators',
  description: 'Quick, free, no signup — get answers in seconds. All calculations happen in your browser and nothing is stored.',
};
