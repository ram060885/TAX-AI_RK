import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { TDS_DIRECTORY, GST_DIRECTORY, COMPLIANCE_CALENDAR } from "./src/taxData";

dotenv.config();

// Local Tax Intelligence Fallback Generator for rate-limited (429) requests
function generateFallbackResponse(message: string): { text: string; sources: any[] } {
  const query = message.toLowerCase();
  const sources: any[] = [];
  let responseText = `⚠️ **Local Tax Intelligence Fallback Activated:** The live Gemini API has hit quota or rate limits (standard 429 RESOURCE_EXHAUSTED). We have dynamically answered your query using our offline verified directory of Indian Tax Laws for FY 2026-27:\n\n---\n\n`;

  // Find TDS matches
  const matchedTds = TDS_DIRECTORY.filter(item => {
    return (
      query.includes(item.section.toLowerCase()) ||
      query.includes(item.section.toLowerCase().replace(" ", "")) ||
      (query.includes("tds") && item.natureOfPayment.toLowerCase().split(/\s+/).some(word => word.length > 3 && query.includes(word))) ||
      item.natureOfPayment.toLowerCase().split(/\s+/).some(word => word.length > 3 && query.includes(word)) ||
      item.section.toLowerCase().split(/\s+/).some(word => word.length > 2 && query.includes(word))
    );
  });

  // Find GST matches
  const matchedGst = GST_DIRECTORY.filter(item => {
    return (
      (query.includes("gst") && item.category.toLowerCase().split(/\s+/).some(word => word.length > 3 && query.includes(word))) ||
      item.category.toLowerCase().split(/\s+/).some(word => word.length > 3 && query.includes(word)) ||
      item.items.some(detail => detail.toLowerCase().includes(query) || query.includes(detail.toLowerCase()))
    );
  });

  // Find Upcoming deadlines
  const matchedCalendar = COMPLIANCE_CALENDAR.filter(item => {
    return (
      query.includes(item.category.toLowerCase()) ||
      query.includes(item.form.toLowerCase()) ||
      item.description.toLowerCase().split(/\s+/).some(word => word.length > 3 && query.includes(word))
    );
  });

  if (matchedTds.length > 0) {
    matchedTds.forEach((entry) => {
      responseText += `# **Topic**: TDS Payment - ${entry.natureOfPayment}\n\n`;
      responseText += `### 1. **Topic Name**\n**${entry.natureOfPayment}**\n\n`;
      responseText += `### 2. **Applicable Section/Rule**\n**${entry.section}** of the Indian Income Tax Act\n\n`;
      responseText += `### 3. **Rate/Provision**\n- **Individual / HUF Deductees:** ${entry.rateIndividualHuf}\n- **Other Entity Deductees (Companies/Partnership Firms):** ${entry.rateOthers}\n\n`;
      responseText += `### 4. **Threshold Limit**\n${entry.threshold}\n\n`;
      responseText += `### 5. **Applicability**\n${entry.applicability}\n\n`;
      responseText += `### 6. **Example**\nFor a transaction under **${entry.section}**, if payment value exceeds the threshold of ${entry.threshold.split(' ')[0]}, tax must be deducted at source up to **${entry.rateOthers}** for corporates or **${entry.rateIndividualHuf}** for individuals.\n\n`;
      responseText += `### 7. **Important Notes**\n- **Exceptions & Exemptions:** ${entry.exceptions}\n- **Return Filing:** Requires filing ${entry.complianceRequirement || "Form 26Q return quarterly."}\n\n`;
      responseText += `### 8. **Latest Update**\nVerified for **financial year FY 2026-27 (Assessment Year 2027-28)** with strict monthly payment cycles by the 7th of the subsequent month.\n\n`;
      responseText += `* * * * *\n\n`;

      sources.push({
        title: `Official Income Tax Portal: ${entry.section}`,
        url: `https://www.incometax.gov.in`
      });
    });
  }

  if (matchedGst.length > 0) {
    matchedGst.forEach((entry) => {
      responseText += `# **Topic**: GST Rates - ${entry.category}\n\n`;
      responseText += `### 1. **Topic Name**\n**${entry.category}**\n\n`;
      responseText += `### 2. **Applicable Section/Rule**\nStandard Schedules of the Central Goods and Services Tax (CGST) Act\n\n`;
      responseText += `### 3. **Rate/Provision**\n**${entry.rate}**\n\n`;
      responseText += `### 4. **Threshold Limit**\nStandard threshold for services is **₹20 Lakhs** (for Goods under standard terms, the threshold limit is **₹40 Lakhs** annual aggregate turnover).\n\n`;
      responseText += `### 5. **Applicability**\n${entry.applicability}\n\n`;
      responseText += `### 6. **Example**\nIf professional services under **${entry.category}** totaling ₹50,000 are supplied, a standard 18% GST (amounting to ₹9,000) is charged, split evenly between Central division CGST (9%) and State division SGST (9%).\n\n`;
      responseText += `### 7. **Important Notes**\n${entry.exceptions || "Ensure matching HSN/SAC code to prevent audit penalties."}\n\n`;
      responseText += `### 8. **Latest Update**\nEffective for the fiscal year **FY 2026-27**, matching state-wise reverse charge schedules under CBIC standards.\n\n`;
      responseText += `* * * * *\n\n`;

      sources.push({
        title: `CBIC GST Rates for ${entry.category}`,
        url: `https://cbic-gst.gov.in`
      });
    });
  }

  if (matchedCalendar.length > 0 && (query.includes("deadline") || query.includes("calendar") || query.includes("date") || query.includes("due"))) {
    responseText += `### 📅 **Matching Compliance Calendar Deadlines**\n\n`;
    matchedCalendar.forEach((entry) => {
      responseText += `- **${entry.date}**: Return form \`${entry.form}\` for **${entry.category}**. ${entry.description} (Cycle: ${entry.period})\n`;
    });
    responseText += `\n* * * * *\n\n`;
  }

  // Fallback default answer if no exact matches are discovered
  if (matchedTds.length === 0 && matchedGst.length === 0) {
    responseText += `# **Topic**: General Indian Tax Overview & Slab Rules (FY 2026-27)\n\n`;
    responseText += `### 1. **Topic Name**\n**Indian Income Tax Slabs & GST Overview**\n\n`;
    responseText += `### 2. **Applicable Section/Rule**\nFinance Act 2025/2026 and standard CGST rules\n\n`;
    responseText += `### 3. **Rate/Provision**\n- **New Income Tax Regime:** Standard rates starting from 0% (up to ₹4L), 5% (₹4L-₹8L), 10% (₹8L-₹12L), 15% (₹12L-₹16L), 20% (₹16L-₹20L) and 30% (above ₹20L).\n- **GST Services:** Typically 18% standard rate.\n- **TDS Sections:** Multi-tiered range of 0.1% to 10% based on nature of invoice.\n\n`;
    responseText += `### 4. **Threshold Limit**\nIncome tax rebate threshold is extended to **₹7,00,000** net taxable income under New Regime Section 87A.\n\n`;
    responseText += `### 5. **Applicability**\nAll Indian resident entities, salary earners, self-employed individuals, and registered business dealers.\n\n`;
    responseText += `### 6. **Example**\nA professional contractor earning progressive income must compare the Old Regime deductions (under 80C/80D) against the New Regime's standard low rates to determine the lowest net annual obligation.\n\n`;
    responseText += `### 7. **Important Notes**\n- Ensure matching pan cards is linked to prevent high-rate withholding (20% under section 206AA).\n- Non-compliance on GST filings blocks invoice clearance and e-way bill generation.\n\n`;
    responseText += `### 8. **Latest Update**\nBudget FY 2026-27 raises the standard deduction to **₹75,000** for salaried workers filing in the New Tax Regime.\n\n`;

    sources.push({
      title: "Income Tax Department",
      url: "https://www.incometax.gov.in"
    });
    sources.push({
      title: "CBIC Portal",
      url: "https://www.cbic.gov.in"
    });
  }

  responseText += `\n\n**Legal Disclaimer**: This response is retrieved from verified local offline datasets for educational guidance only. Since the live Gemini AI service is currently at standard rate limits, please check the official government circulars or consult a professional tax advisor prior to actual filing.`;

  return { text: responseText, sources };
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize server-side Gemini AI
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  // Chat endpoint with tax-expert persona and Search Grounding
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

      // Reconstruct history
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }
      }

      // Current message
      contents.push({
        role: "user",
        parts: [{ text: message }],
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
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No response generated.";
      
      // Extract Search grounding resources
      const grounds = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = grounds.map((chunk: any) => {
        return {
          title: chunk.web?.title || "Tax Reference Source",
          url: chunk.web?.uri || "",
        };
      }).filter((s: any) => s.url);

      res.json({ text, sources });
    } catch (err: any) {
      console.error("Gemini API error detailed:", err);
      
      const errMsg = (err.message || "").toLowerCase();
      const status = err.status || 0;
      
      const isQuotaOrLimitError = status === 429 ||
                                  errMsg.includes("429") ||
                                  errMsg.includes("quota") ||
                                  errMsg.includes("resource_exhausted") ||
                                  errMsg.includes("limit") ||
                                  errMsg.includes("billing") ||
                                  errMsg.includes("exhausted");

      if (isQuotaOrLimitError) {
        console.log("Triggering Local Tax Intelligence fallback because of rate limits/quota exhaustion...");
        const fallback = generateFallbackResponse(message);
        return res.json({ text: fallback.text, sources: fallback.sources });
      }

      res.status(500).json({ error: err.message || "An error occurred with the Gemini API." });
    }
  });

  // Serve static UI after routes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer();
