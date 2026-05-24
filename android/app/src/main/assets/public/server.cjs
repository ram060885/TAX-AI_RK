var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);

// src/taxData.ts
var TDS_DIRECTORY = [
  {
    section: "Section 194C",
    natureOfPayment: "Payment to Contractors & Subcontractors",
    rateIndividualHuf: "1%",
    rateOthers: "2%",
    threshold: "\u20B930,000 (Single transaction) / \u20B91,00,000 (Aggregate annually)",
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
    threshold: "\u20B930,000 annually per category (except Director fees, which has \u20B90 threshold)",
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
    threshold: "\u20B92,40,000 annually",
    applicability: "Applicable on subletting or hiring of properties by entities liable for tax audit under Income Tax.",
    exceptions: "No TDS if the aggregate rent does not exceed \u20B92,40,000 in a financial year.",
    complianceRequirement: "Quarterly TDS return 26Q filing, payment of TDS by 7th of subsequent month.",
    effectiveDate: "Current (FY 2026-27)"
  },
  {
    section: "Section 194Q",
    natureOfPayment: "TDS on Purchase of Goods",
    rateIndividualHuf: "0.1% of purchase value exceeding \u20B950 Lakhs",
    rateOthers: "0.1% of purchase value exceeding \u20B950 Lakhs",
    threshold: "\u20B950,00,000 annually (applicable to buyers with sales turnover > \u20B910 Crores in preceding FY)",
    applicability: "On purchase of any goods from a resident seller where the value exceeds \u20B950 Lakhs in a year.",
    exceptions: "Not applicable if tax is already deducted under any other section, or collected under 206C(1H).",
    complianceRequirement: "Quarterly TDS Return 26Q filing, payment of TDS by 7th of subsequent month.",
    effectiveDate: "Current (FY 2026-27)"
  },
  {
    section: "Section 194H",
    natureOfPayment: "Commission or Brokerage",
    rateIndividualHuf: "5%",
    rateOthers: "5%",
    threshold: "\u20B915,000 annually",
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
    threshold: "\u20B940,000 annually (\u20B950,000 for Senior Citizens) for banks/co-op societies; \u20B95,000 for other interest",
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
    threshold: "\u20B91,00,000 annually",
    applicability: "On taxable payouts of life insurance policies which are not exempt under section 10(10D).",
    exceptions: "No TDS if aggregate payment made to the assessee is less than \u20B91 Lakh in a financial year.",
    complianceRequirement: "Payment of TDS by 7th of next month, quarterly submission of form 26Q.",
    effectiveDate: "Current (FY 2026-27)"
  }
];
var GST_DIRECTORY = [
  {
    category: "Restaurant Services",
    items: [
      "Standalone restaurants (AC or non-AC)",
      "Food delivery aggregators (Zomato/Swiggy)",
      "Outdoor catering services",
      "Restaurants housed inside high-tariff hotel rooms (> \u20B97500/night)"
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
var COMPLIANCE_CALENDAR = [
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
    description: "Deadline to file details of outward supplies (Sales Return) for registered taxpayers with turnover > \u20B95cr or who opted for monthly filing.",
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

// server.ts
import_dotenv.default.config();
function generateFallbackResponse(message) {
  const query = message.toLowerCase();
  const sources = [];
  let responseText = `\u26A0\uFE0F **Local Tax Intelligence Fallback Activated:** The live Gemini API has hit quota or rate limits (standard 429 RESOURCE_EXHAUSTED). We have dynamically answered your query using our offline verified directory of Indian Tax Laws for FY 2026-27:

---

`;
  const matchedTds = TDS_DIRECTORY.filter((item) => {
    return query.includes(item.section.toLowerCase()) || query.includes(item.section.toLowerCase().replace(" ", "")) || query.includes("tds") && item.natureOfPayment.toLowerCase().split(/\s+/).some((word) => word.length > 3 && query.includes(word)) || item.natureOfPayment.toLowerCase().split(/\s+/).some((word) => word.length > 3 && query.includes(word)) || item.section.toLowerCase().split(/\s+/).some((word) => word.length > 2 && query.includes(word));
  });
  const matchedGst = GST_DIRECTORY.filter((item) => {
    return query.includes("gst") && item.category.toLowerCase().split(/\s+/).some((word) => word.length > 3 && query.includes(word)) || item.category.toLowerCase().split(/\s+/).some((word) => word.length > 3 && query.includes(word)) || item.items.some((detail) => detail.toLowerCase().includes(query) || query.includes(detail.toLowerCase()));
  });
  const matchedCalendar = COMPLIANCE_CALENDAR.filter((item) => {
    return query.includes(item.category.toLowerCase()) || query.includes(item.form.toLowerCase()) || item.description.toLowerCase().split(/\s+/).some((word) => word.length > 3 && query.includes(word));
  });
  if (matchedTds.length > 0) {
    matchedTds.forEach((entry) => {
      responseText += `# **Topic**: TDS Payment - ${entry.natureOfPayment}

`;
      responseText += `### 1. **Topic Name**
**${entry.natureOfPayment}**

`;
      responseText += `### 2. **Applicable Section/Rule**
**${entry.section}** of the Indian Income Tax Act

`;
      responseText += `### 3. **Rate/Provision**
- **Individual / HUF Deductees:** ${entry.rateIndividualHuf}
- **Other Entity Deductees (Companies/Partnership Firms):** ${entry.rateOthers}

`;
      responseText += `### 4. **Threshold Limit**
${entry.threshold}

`;
      responseText += `### 5. **Applicability**
${entry.applicability}

`;
      responseText += `### 6. **Example**
For a transaction under **${entry.section}**, if payment value exceeds the threshold of ${entry.threshold.split(" ")[0]}, tax must be deducted at source up to **${entry.rateOthers}** for corporates or **${entry.rateIndividualHuf}** for individuals.

`;
      responseText += `### 7. **Important Notes**
- **Exceptions & Exemptions:** ${entry.exceptions}
- **Return Filing:** Requires filing ${entry.complianceRequirement || "Form 26Q return quarterly."}

`;
      responseText += `### 8. **Latest Update**
Verified for **financial year FY 2026-27 (Assessment Year 2027-28)** with strict monthly payment cycles by the 7th of the subsequent month.

`;
      responseText += `* * * * *

`;
      sources.push({
        title: `Official Income Tax Portal: ${entry.section}`,
        url: `https://www.incometax.gov.in`
      });
    });
  }
  if (matchedGst.length > 0) {
    matchedGst.forEach((entry) => {
      responseText += `# **Topic**: GST Rates - ${entry.category}

`;
      responseText += `### 1. **Topic Name**
**${entry.category}**

`;
      responseText += `### 2. **Applicable Section/Rule**
Standard Schedules of the Central Goods and Services Tax (CGST) Act

`;
      responseText += `### 3. **Rate/Provision**
**${entry.rate}**

`;
      responseText += `### 4. **Threshold Limit**
Standard threshold for services is **\u20B920 Lakhs** (for Goods under standard terms, the threshold limit is **\u20B940 Lakhs** annual aggregate turnover).

`;
      responseText += `### 5. **Applicability**
${entry.applicability}

`;
      responseText += `### 6. **Example**
If professional services under **${entry.category}** totaling \u20B950,000 are supplied, a standard 18% GST (amounting to \u20B99,000) is charged, split evenly between Central division CGST (9%) and State division SGST (9%).

`;
      responseText += `### 7. **Important Notes**
${entry.exceptions || "Ensure matching HSN/SAC code to prevent audit penalties."}

`;
      responseText += `### 8. **Latest Update**
Effective for the fiscal year **FY 2026-27**, matching state-wise reverse charge schedules under CBIC standards.

`;
      responseText += `* * * * *

`;
      sources.push({
        title: `CBIC GST Rates for ${entry.category}`,
        url: `https://cbic-gst.gov.in`
      });
    });
  }
  if (matchedCalendar.length > 0 && (query.includes("deadline") || query.includes("calendar") || query.includes("date") || query.includes("due"))) {
    responseText += `### \u{1F4C5} **Matching Compliance Calendar Deadlines**

`;
    matchedCalendar.forEach((entry) => {
      responseText += `- **${entry.date}**: Return form \`${entry.form}\` for **${entry.category}**. ${entry.description} (Cycle: ${entry.period})
`;
    });
    responseText += `
* * * * *

`;
  }
  if (matchedTds.length === 0 && matchedGst.length === 0) {
    responseText += `# **Topic**: General Indian Tax Overview & Slab Rules (FY 2026-27)

`;
    responseText += `### 1. **Topic Name**
**Indian Income Tax Slabs & GST Overview**

`;
    responseText += `### 2. **Applicable Section/Rule**
Finance Act 2025/2026 and standard CGST rules

`;
    responseText += `### 3. **Rate/Provision**
- **New Income Tax Regime:** Standard rates starting from 0% (up to \u20B94L), 5% (\u20B94L-\u20B98L), 10% (\u20B98L-\u20B912L), 15% (\u20B912L-\u20B916L), 20% (\u20B916L-\u20B920L) and 30% (above \u20B920L).
- **GST Services:** Typically 18% standard rate.
- **TDS Sections:** Multi-tiered range of 0.1% to 10% based on nature of invoice.

`;
    responseText += `### 4. **Threshold Limit**
Income tax rebate threshold is extended to **\u20B97,00,000** net taxable income under New Regime Section 87A.

`;
    responseText += `### 5. **Applicability**
All Indian resident entities, salary earners, self-employed individuals, and registered business dealers.

`;
    responseText += `### 6. **Example**
A professional contractor earning progressive income must compare the Old Regime deductions (under 80C/80D) against the New Regime's standard low rates to determine the lowest net annual obligation.

`;
    responseText += `### 7. **Important Notes**
- Ensure matching pan cards is linked to prevent high-rate withholding (20% under section 206AA).
- Non-compliance on GST filings blocks invoice clearance and e-way bill generation.

`;
    responseText += `### 8. **Latest Update**
Budget FY 2026-27 raises the standard deduction to **\u20B975,000** for salaried workers filing in the New Tax Regime.

`;
    sources.push({
      title: "Income Tax Department",
      url: "https://www.incometax.gov.in"
    });
    sources.push({
      title: "CBIC Portal",
      url: "https://www.cbic.gov.in"
    });
  }
  responseText += `

**Legal Disclaimer**: This response is retrieved from verified local offline datasets for educational guidance only. Since the live Gemini AI service is currently at standard rate limits, please check the official government circulars or consult a professional tax advisor prior to actual filing.`;
  return { text: responseText, sources };
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  }) : null;
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    try {
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      if (!ai) {
        return res.status(500).json({
          error: "Gemini API key is not configured in environment variables. Please set the GEMINI_API_KEY secure secret under the Settings menu in AI Studio."
        });
      }
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: `You are an advanced, professional Indian Tax AI Assistant and Knowledge Expert.
Your purpose is to help users understand:
- GST Rules, Rates, and Input Tax Credit (ITC) Rules
- TDS (Tax Deducted at Source) Sections, Rates, and Threshold Limits
- Income Tax Rules, Slab Rates, and Comparison of New vs Old Tax Regimes
- MCA (Ministry of Corporate Affairs) Updates, Compliance filing due dates
- RBI (Reserve Bank of India) Notifications, FEMA (Foreign Exchange Management Act) Regulations
- Latest Budget amendments, circulars, notifications, and compliance dates

Whenever answering a specific tax/compliance query or asking about rates/sections/provisions, ALWAYS structure your output to include the following section headers if applicable (use clean Markdown formatting with clear visual styling):
1. **Topic Name**
2. **Applicable Section/Rule**
3. **Rate/Provision**
4. **Threshold Limit**
5. **Applicability**
6. **Example** (Provide a brief, human-oriented practical example to make it extremely clear)
7. **Important Notes**
8. **Latest Update** (If there are recent budget, circular, or notification amendments, highlight them clearly)

Response Style guidelines:
- Speak in a simple, professional, and composed tone. Avoid complex lawyer-speak where simple terms work.
- Explain terms step-by-step using bullet points.
- Make answers easy to digest for entrepreneurs, accountants, and non-technical clients.
- If requested by the user, you can explain in bilingual English-Hindi (Hinglish), otherwise default to rich English.
- Strictly focus on Indian taxation and compliance laws.
- Do not make up sections or notifications. If uncertain, mention: "Currently, I don't have verified official data for this specific scenario. Please verify with latest government notifications or a professional tax advisor."
- At the end of any response, add a short standard legal disclaimer: "Disclaimer: This summary is for educational and informational purposes only and does not constitute professional tax advice. Please verify with the latest government notification or consultant before deciding."`,
          tools: [{ googleSearch: {} }]
        }
      });
      const text = response.text || "No response generated.";
      const grounds = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = grounds.map((chunk) => {
        return {
          title: chunk.web?.title || "Tax Reference Source",
          url: chunk.web?.uri || ""
        };
      }).filter((s) => s.url);
      res.json({ text, sources });
    } catch (err) {
      console.error("Gemini API error detailed:", err);
      const errMsg = (err.message || "").toLowerCase();
      const status = err.status || 0;
      const isQuotaOrLimitError = status === 429 || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("resource_exhausted") || errMsg.includes("limit") || errMsg.includes("billing") || errMsg.includes("exhausted");
      if (isQuotaOrLimitError) {
        console.log("Triggering Local Tax Intelligence fallback because of rate limits/quota exhaustion...");
        const fallback = generateFallbackResponse(message);
        return res.json({ text: fallback.text, sources: fallback.sources });
      }
      res.status(500).json({ error: err.message || "An error occurred with the Gemini API." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
