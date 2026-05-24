/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TDSEntry, GSTEntry, DueDateItem } from "./types";

export const TDS_DIRECTORY: TDSEntry[] = [
  {
    section: "Section 194C",
    natureOfPayment: "Payment to Contractors & Subcontractors",
    rateIndividualHuf: "1%",
    rateOthers: "2%",
    threshold: "₹30,000 (Single transaction) / ₹1,00,000 (Aggregate annually)",
    applicability: "Applicable on any work contract, including advertising, broadcasting, gas/water supply, cargo/passenger transport.",
    exceptions: "No TDS if contractor is in transport business and provides PAN. No TDS if payment is for personal purpose of individual/HUF.",
    complianceRequirement: "Filing of form 26Q quarterly, payment of TDS by 7th of subsequent month.",
    effectiveDate: "Current (FY 2026-27)"
  },
  {
    section: "Section 194J",
    natureOfPayment: "Fees for Professional or Technical Services",
    rateIndividualHuf: "10% (Professional fee / Royality) / 2% (Technical fee / Call Centre / Royalty for movies)",
    rateOthers: "10% (Professional fee / Royality) / 2% (Technical fee / Call Centre / Royalty for movies)",
    threshold: "₹30,000 annually per category (except Director fees, which has ₹0 threshold)",
    applicability: "Fees for professional, technical, royalty, non-compete fees, or director remuneration.",
    exceptions: "No TDS on technical services or professional services for personal purposes by Individual/HUF.",
    complianceRequirement: "Filing of form 26Q chart quarterly, payment of TDS by 7th of subsequent month.",
    effectiveDate: "Current (FY 2026-27)"
  },
  {
    section: "Section 194I",
    natureOfPayment: "Rent Payments (Land, Building, Equipment)",
    rateIndividualHuf: "10% for Land & Building / 2% for Plant & Machinery / Equipment",
    rateOthers: "10% for Land & Building / 2% for Plant & Machinery / Equipment",
    threshold: "₹2,40,000 annually",
    applicability: "Applicable on subletting or hiring of properties by entities liable for tax audit under Income Tax.",
    exceptions: "No TDS if the aggregate rent does not exceed ₹2,40,000 in a financial year.",
    complianceRequirement: "Quarterly TDS return 26Q filing, payment of TDS by 7th of subsequent month.",
    effectiveDate: "Current (FY 2026-27)"
  },
  {
    section: "Section 194Q",
    natureOfPayment: "TDS on Purchase of Goods",
    rateIndividualHuf: "0.1% of purchase value exceeding ₹50 Lakhs",
    rateOthers: "0.1% of purchase value exceeding ₹50 Lakhs",
    threshold: "₹50,00,000 annually (applicable to buyers with sales turnover > ₹10 Crores in preceding FY)",
    applicability: "On purchase of any goods from a resident seller where the value exceeds ₹50 Lakhs in a year.",
    exceptions: "Not applicable if tax is already deducted under any other section, or collected under 206C(1H).",
    complianceRequirement: "Quarterly TDS Return 26Q filing, payment of TDS by 7th of subsequent month.",
    effectiveDate: "Current (FY 2026-27)"
  },
  {
    section: "Section 194H",
    natureOfPayment: "Commission or Brokerage",
    rateIndividualHuf: "5%",
    rateOthers: "5%",
    threshold: "₹15,000 annually",
    applicability: "Commission on services for buying/selling goods (excluding insurance commission) or trade transactions.",
    exceptions: "No TDS of sub-brokerage or brokerage on public issue of shares.",
    complianceRequirement: "Filing of form 26Q quarterly, payment by 7th of subsequent month.",
    effectiveDate: "Current (FY 2026-27)"
  },
  {
    section: "Section 194A",
    natureOfPayment: "Interest other than Interest on Securities",
    rateIndividualHuf: "10%",
    rateOthers: "10%",
    threshold: "₹40,000 annually (₹50,000 for Senior Citizens) for banks/co-op societies; ₹5,000 for other interest",
    applicability: "Applicable on interest payouts on fixed deposits (FDs), recurring deposits (RDs), or loans given.",
    exceptions: "Form 15G/15H can be submitted for Nil deduction if total income is below taxable limit.",
    complianceRequirement: "Filing of quarterly return form 26Q, deposit within 7th of next month.",
    effectiveDate: "Current (FY 2026-27)"
  },
  {
    section: "Section 194DA",
    natureOfPayment: "Payment in respect of Life Insurance Policy",
    rateIndividualHuf: "5% (on net maturity income portion only)",
    rateOthers: "5% (on net maturity income portion only)",
    threshold: "₹1,00,000 annually",
    applicability: "On taxable payouts of life insurance policies which are not exempt under section 10(10D).",
    exceptions: "No TDS if aggregate payment made to the assessee is less than ₹1 Lakh in a financial year.",
    complianceRequirement: "Payment of TDS by 7th of next month, quarterly submission of form 26Q.",
    effectiveDate: "Current (FY 2026-27)"
  }
];

export const GST_DIRECTORY: GSTEntry[] = [
  {
    category: "Restaurant Services",
    items: [
      "Standalone restaurants (AC or non-AC)",
      "Food delivery aggregators (Zomato/Swiggy)",
      "Outdoor catering services",
      "Restaurants housed inside high-tariff hotel rooms (> ₹7500/night)"
    ],
    rate: "5% (Without ITC) for standalone; 18% (With ITC) for high-tariff hotel restaurants or outdoor catering",
    applicability: "Applicable on all restaurant bills and food service items.",
    exceptions: "No Input Tax Credit (ITC) can be claimed when paying 5% GST."
  },
  {
    category: "Manpower Services",
    items: [
      "Manpower supply for security services",
      "Recruitment agency operations",
      "Contractual staff supply",
      "Housekeeping staff supply"
    ],
    rate: "18% GST",
    applicability: "Standard taxable service under GST. RCM (Reverse Charge Mechanism) applies if the manpower supply is by an unregistered person or individual to a registered corporate entity.",
    exceptions: "Pure services provided to Central/State Govt/Local Authorities are exempt in some specified cases."
  },
  {
    category: "Professional Services",
    items: [
      "Legal fee services by senior advocates (subject to Reverse Charge Mechanism)",
      "Chartered Accountant services",
      "Software Development consultancy",
      "Technical consultancy"
    ],
    rate: "18% GST (Subject to RCM if legal service supplied by an advocate to a business entity)",
    applicability: "Levied on gross consultation value or hourly charges.",
    exceptions: "Reverse Charge Mechanism (RCM) applies to legal services where the business entity is the tax payee."
  },
  {
    category: "Essential Goods & Food Grains",
    items: [
      "Unbranded wheat, rice, pulses, pre-packaged flour if unbranded or exempt",
      "Fresh vegetables and fruits",
      "Milk, curd, lassi (unbranded and non-packaged)",
      "Fresh eggs and meat"
    ],
    rate: "0% (Exempt) or 5% if pre-packaged and pre-labeled",
    applicability: "Applicable based on pre-packaged/labeled rules since July 2022 amendment.",
    exceptions: "Branded, pre-packaged commodities are taxable at 5%."
  },
  {
    category: "IT & Software Services",
    items: [
      "SaaS / Cloud subscriptions",
      "Custom Software development",
      "IT troubleshooting, system integration",
      "Purchase of pre-packaged software licenses"
    ],
    rate: "18% GST",
    applicability: "Levied as supply of services.",
    exceptions: "Exports of software services are zero-rated under LUT (Letter of Undertaking) without payment of GST."
  },
  {
    category: "Works Contract & Construction",
    items: [
      "Commercial construction contracts",
      "Residential affordable housing contracts",
      "Infrastructure development works"
    ],
    rate: "12% for affordable housing / 18% for commercial works contract and other construction material service",
    applicability: "Composite supply of works contract.",
    exceptions: "Works contract supplied directly to governments/local bodies have special rules/rates."
  }
];

export const COMPLIANCE_CALENDAR: DueDateItem[] = [
  {
    date: "7th of Every Month",
    form: "Challan ITNS 281",
    category: "TDS",
    description: "Deadline to deposit TDS (Tax Deducted at Source) collected during the preceding month.",
    period: "Monthly"
  },
  {
    date: "11th of Every Month",
    form: "GSTR-1",
    category: "GST",
    description: "Deadline to file details of outward supplies (Sales Return) for registered taxpayers with turnover > ₹5cr or who opted for monthly filing.",
    period: "Monthly"
  },
  {
    date: "20th of Every Month",
    form: "GSTR-3B",
    category: "GST",
    description: "Deadline to file summary return GSTR-3B and pay the due GST tax for the preceding month.",
    period: "Monthly"
  },
  {
    date: "31st of July 2026",
    form: "ITR (Non-Audit)",
    category: "Income Tax",
    description: "Deadline to file Income Tax Returns (ITR) for Individuals, HUFs, and non-audit taxpayers for FY 2025-26 (AY 2026-27).",
    period: "Annual"
  },
  {
    date: "31st of October 2026",
    form: "ITR (Audit Cases)",
    category: "Income Tax",
    description: "Deadline to file Income Tax Returns (ITR) for corporate businesses or taxpayers subject to Audit (Form 3CD).",
    period: "Annual"
  },
  {
    date: "31st of July / Oct / Jan / May",
    form: "Form 26Q / 24Q",
    category: "TDS",
    description: "Due date for filing quarterly TDS returns for the respective quarters (e.g., Q1 - July 31, Q2 - October 31, etc.).",
    period: "Quarterly"
  }
];
