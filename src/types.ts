/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  sources?: ChatSource[];
}

export interface TDSEntry {
  section: string;
  natureOfPayment: string;
  rateIndividualHuf: string;
  rateOthers: string;
  threshold: string;
  applicability: string;
  exceptions: string;
  complianceRequirement?: string;
  effectiveDate?: string;
}

export interface GSTEntry {
  category: string;
  items: string[];
  rate: string;
  applicability: string;
  exceptions?: string;
}

export interface TaxRegimeSlab {
  min: number;
  max: number;
  rate: number;
}

export interface TaxCalculationResult {
  taxableIncome: number;
  deductions: number;
  grossTax: number;
  cess: number;
  totalTax: number;
  slabsBreakdown: { slab: string; tax: number; rate: number }[];
}

export interface DueDateItem {
  date: string;
  form: string;
  category: "GST" | "TDS" | "Income Tax" | "Companies Act";
  description: string;
  period: string;
}
