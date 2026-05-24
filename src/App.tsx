/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Calculator,
  CalendarDays,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  FileCheck,
  AlertCircle,
  LogOut,
  ChevronRight,
  Info,
  Scale,
  RefreshCw,
  Send,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Percent,
  Layers,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

import { ChatMessage, ChatSource, TDSEntry, GSTEntry, DueDateItem } from "./types";
import { TDS_DIRECTORY, GST_DIRECTORY, COMPLIANCE_CALENDAR } from "./taxData";

interface PinkBlueCardProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  innerClassName?: string;
  isActive?: boolean;
}

export function PinkBlueCard({ children, onClick, className = "", innerClassName = "", isActive = false }: PinkBlueCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative p-[1.5px] rounded-[2rem] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 transition-all duration-300 ${
        onClick ? "cursor-pointer hover:scale-[1.015] hover:shadow-[0_12px_24px_-10px_rgba(236,72,153,0.3)] active:scale-[0.99]" : ""
      } ${isActive ? "shadow-[0_8px_20px_-6px_rgba(236,72,153,0.25)] scale-[1.01]" : "hover:shadow-md shadow-xs"} ${className}`}
    >
      <div className={`bg-white p-6 rounded-[calc(2rem-1.5px)] h-full w-full relative overflow-hidden flex flex-col justify-between ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = React.useState<"chat" | "gst" | "tds" | "calculator" | "calendar">("chat");

  // Chat workflow state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "model",
      text: `Welcome to Tax Intelligence AI Assistant.\n\nYou can ask about:\n* **GST Rates**\n* **TDS Rules**\n* **Income Tax Questions**\n* **Latest Amendments**\n* **Compliance Requirements**\n* **Notification Summaries**\n* **Practical Tax Examples**\n\n**Example Questions you can ask below or click directly:**\n• What is GST on manpower services?\n• Explain TDS under 194C\n• Latest GST amendments\n• GST registration threshold\n• TDS on professional fees\n\nHow can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [headerSearch, setHeaderSearch] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expertMode, setExpertMode] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Search & Filter state
  const [gstSearch, setGstSearch] = useState("");
  const [tdsSearch, setTdsSearch] = useState("");
  const [selectedGstRate, setSelectedGstRate] = useState<string>("All");

  // Tax Calculator Inputs
  const [salaryIncome, setSalaryIncome] = useState<number>(1200000);
  const [otherIncome, setOtherIncome] = useState<number>(100000);
  const [deductions80C, setDeductions80C] = useState<number>(150000); // 80C limit is 1.5L
  const [deductions80D, setDeductions80D] = useState<number>(25000); // medical standard
  const [otherDeductions, setOtherDeductions] = useState<number>(50000); 

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Quick Chat triggers
  const executeQuickQuestion = (question: string) => {
    setActiveTab("chat");
    handleSendMessage(question);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawMsg = textToSend || inputMessage;
    if (!rawMsg.trim()) return;

    if (!textToSend) {
      setInputMessage("");
    }

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: rawMsg,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      const chatHistory = messages
        .filter(m => m.id !== "initial-welcome")
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: rawMsg,
          history: chatHistory
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Internal Server Error");
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date(),
        sources: data.sources || []
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `api-err-${Date.now()}`,
        role: "model",
        text: `⚠️ **Server Connectivity Check:** ${err.message || "Failed to communicate with Indian Tax AI Assistant."}\n\n*Please verify that the GEMINI_API_KEY environment variable is configured in your AI Studio secrets panel and that your server is running successfully.*`,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Header Search handler (direct prompts to AI)
  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      executeQuickQuestion(headerSearch);
      setHeaderSearch("");
    }
  };

  // GST rate filter logic
  const filteredGst = GST_DIRECTORY.filter(entry => {
    const matchesSearch = entry.category.toLowerCase().includes(gstSearch.toLowerCase()) ||
      entry.items.some(item => item.toLowerCase().includes(gstSearch.toLowerCase())) ||
      entry.applicability.toLowerCase().includes(gstSearch.toLowerCase());

    if (selectedGstRate === "All") return matchesSearch;
    return matchesSearch && entry.rate.includes(selectedGstRate);
  });

  // TDS section filter logic
  const filteredTds = TDS_DIRECTORY.filter(entry => {
    return entry.section.toLowerCase().includes(tdsSearch.toLowerCase()) ||
      entry.natureOfPayment.toLowerCase().includes(tdsSearch.toLowerCase()) ||
      entry.applicability.toLowerCase().includes(tdsSearch.toLowerCase());
  });

  // Income calculations
  const calculateOldTax = () => {
    const grossIncome = salaryIncome + otherIncome;
    const stdDeduction = salaryIncome > 0 ? 50000 : 0;
    const totalDeductions = stdDeduction + Math.min(deductions85CWithLimit(deductions80C), 150000) + deductions80D + otherDeductions;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    let grossTax = 0;

    const slabs = [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: Infinity, rate: 30 }
    ];

    const parsedBreakdown: any[] = [];
    for (const slab of slabs) {
      if (taxableIncome > slab.min) {
        const taxableAmtInSlab = Math.min(taxableIncome, slab.max) - slab.min;
        const slabTax = (taxableAmtInSlab * slab.rate) / 100;
        grossTax += slabTax;
        parsedBreakdown.push({
          slab: `${slab.min === 0 ? "0" : "₹" + (slab.min / 100000).toFixed(1) + "L"}${slab.max === Infinity ? " +" : " - ₹" + (slab.max / 100000).toFixed(1) + "L"}`,
          tax: slabTax,
          rate: slab.rate
        });
      }
    }

    let netTax = grossTax;
    if (taxableIncome <= 500000) {
      netTax = 0;
    }

    const cess = (netTax * 4) / 100;
    const totalTax = netTax + cess;

    return {
      taxableIncome,
      deductions: totalDeductions,
      grossTax: netTax,
      cess,
      totalTax,
      slabsBreakdown: parsedBreakdown
    };
  };

  const deductions85CWithLimit = (val: number) => {
    return Math.min(val, 150000);
  };

  const calculateNewTax = () => {
    const grossIncome = salaryIncome + otherIncome;
    const stdDeduction = salaryIncome > 0 ? 75000 : 0;
    const totalDeductions = stdDeduction; 
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    let grossTax = 0;
    const parsedBreakdown: any[] = [];

    const slabs = [
      { min: 0, max: 400000, rate: 0 },
      { min: 400000, max: 800000, rate: 5 },
      { min: 800000, max: 1200000, rate: 10 },
      { min: 1200000, max: 1600000, rate: 15 },
      { min: 1600000, max: 2000000, rate: 20 },
      { min: 2000000, max: Infinity, rate: 30 }
    ];

    for (const slab of slabs) {
      if (taxableIncome > slab.min) {
        const taxableAmtInSlab = Math.min(taxableIncome, slab.max) - slab.min;
        const slabTax = (taxableAmtInSlab * slab.rate) / 100;
        grossTax += slabTax;
        parsedBreakdown.push({
          slab: `${slab.min === 0 ? "0" : "₹" + (slab.min / 100000).toFixed(1) + "L"}${slab.max === Infinity ? " +" : " - ₹" + (slab.max / 100000).toFixed(1) + "L"}`,
          tax: slabTax,
          rate: slab.rate
        });
      }
    }

    let netTax = grossTax;
    if (taxableIncome <= 1200000) {
      netTax = 0;
    }

    const cess = (netTax * 4) / 100;
    const totalTax = netTax + cess;

    return {
      taxableIncome,
      deductions: totalDeductions,
      grossTax: netTax,
      cess,
      totalTax,
      slabsBreakdown: parsedBreakdown
    };
  };

  const oldResult = calculateOldTax();
  const newResult = calculateNewTax();
  const bestRegime = oldResult.totalTax <= newResult.totalTax ? "Old Regime" : "New Regime";
  const taxSavings = Math.abs(oldResult.totalTax - newResult.totalTax);

  const formatINR = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Get human friendly title for the result cards
  const getTabTitle = () => {
    switch (activeTab) {
      case "chat": return "AI Tax Consultant & Search grounder";
      case "gst": return "GST Rates Finder";
      case "tds": return "TDS Section Directory";
      case "calculator": return "Income Tax Slabs Comparator";
      case "calendar": return "Due Dates Compliance Calendar";
      default: return "Dashboard";
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      
      {/* Top Navbar Sleek Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 shrink-0 z-10 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-600/25">
            <Scale className="w-5.5 h-5.5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-display">
            Tax Intelligence <span className="text-pink-500 font-extrabold">AI</span>
          </span>
        </div>
        
        {/* Search container in header */}
        <div className="flex-1 max-w-xl mx-12 hidden md:block">
          <form onSubmit={handleHeaderSearchSubmit} className="relative">
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Ask AI GST rates, TDS sections, or circulars..."
              className="w-full bg-slate-900 hover:bg-slate-800/85 focus:bg-slate-950 border border-slate-800 rounded-full py-2 px-5 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-pink-550 transition-all placeholder:text-slate-500 text-slate-100"
            />
            <Search className="absolute left-4 top-2.5 text-slate-500 w-4.5 h-4.5" />
          </form>
        </div>

        {/* User initials & toggle flags of header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setExpertMode(!expertMode)}
            className={`px-4 py-2 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 border ${
              expertMode 
                ? "bg-pink-600/15 text-pink-400 hover:bg-pink-600/25 border-pink-500/30" 
                : "bg-slate-900 text-slate-300 hover:bg-slate-850 border-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{expertMode ? "Expert Rules On" : "Standard Mode"}</span>
          </button>
          
          <div 
            title="Logged in as ram.halder@myndsol.com"
            className="w-9 h-9 bg-pink-600 text-white font-bold rounded-full border-2 border-slate-955 flex items-center justify-center text-xs shadow-md select-none cursor-help"
          >
            RH
          </div>
        </div>
      </header>

      {/* Main Container below navbar */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Menu */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col p-4 shrink-0 justify-between overflow-y-auto text-slate-100">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-3.5 ml-2 tracking-widest">
                Knowledge Base
              </p>
              
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "chat"
                      ? "bg-pink-600 text-white font-bold shadow-md shadow-pink-600/15"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-inherit" />
                  <span>AI Assistant</span>
                  <Sparkles className="w-3.5 h-3.5 ml-auto text-amber-500 animate-pulse" />
                </button>

                <button
                  onClick={() => setActiveTab("gst")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "gst"
                      ? "bg-pink-600 text-white font-bold shadow-md shadow-pink-600/15"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Percent className="w-4 h-4 shrink-0 text-inherit" />
                  <span>GST Rates Finder</span>
                </button>

                <button
                  onClick={() => setActiveTab("tds")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "tds"
                      ? "bg-pink-600 text-white font-bold shadow-md shadow-pink-600/15"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0 text-inherit" />
                  <span>TDS Dictionary</span>
                </button>

                <button
                  onClick={() => setActiveTab("calculator")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "calculator"
                      ? "bg-pink-600 text-white font-bold shadow-md shadow-pink-600/15"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Calculator className="w-4 h-4 shrink-0 text-inherit" />
                  <span>IT Slabs Comparator</span>
                </button>

                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "calendar"
                      ? "bg-pink-600 text-white font-bold shadow-md shadow-pink-600/15"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <CalendarDays className="w-4 h-4 shrink-0 text-inherit" />
                  <span>Filing Due Dates</span>
                </button>
              </nav>
            </div>

            {/* Quick list filters / tags */}
            <div className="pt-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2.5 ml-2 tracking-widest">
                Quick Prompts
              </p>
              <div className="space-y-1 px-1">
                <button
                  onClick={() => executeQuickQuestion("What are the criteria for GST registration threshold limits in FY 2026-27?")}
                  className="w-full text-left text-xs text-slate-400 hover:text-pink-400 hover:underline py-1 transition-colors"
                >
                  • GST Registration Thresholds
                </button>
                <button
                  onClick={() => executeQuickQuestion("What is the penalty for late payment of TDS under section 201(1A)?")}
                  className="w-full text-left text-xs text-slate-400 hover:text-pink-400 hover:underline py-1 transition-colors"
                >
                  • TDS Penalties Section 201
                </button>
                <button
                  onClick={() => executeQuickQuestion("Explain TDS rules under section 194Q for purchase of goods")}
                  className="w-full text-left text-xs text-slate-400 hover:text-pink-400 hover:underline py-1 transition-colors"
                >
                  • TDS on Goods Sec 194Q
                </button>
              </div>
            </div>
          </div>

          {/* New Amendment Notifier sidebar card */}
          <div className="mt-auto">
            <div className="p-4 bg-slate-950 text-white rounded-2xl shadow-inner border border-slate-800 overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-[10px] text-pink-450 font-semibold tracking-wider uppercase">
                  NEW AMENDMENT
                </p>
                <p className="text-xs font-bold mt-1 leading-tight font-display">
                  Section 194R Update (Circular 12/2023)
                </p>
                <button
                  onClick={() => executeQuickQuestion("Explain Section 194R update regarding benefit or perquisite in business and summarize Circular 12/2023.")}
                  className="mt-3.5 text-[10px] bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-lg uppercase tracking-wider font-bold transition-all w-full text-center"
                >
                  Summarize
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-pink-500/10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </aside>

        {/* Main Workspace Frame container */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto gap-6 min-h-0">
          
          {/* Top Indicators Bento Grid row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 shrink-0">
            
            {/* CARD 1: Active Standard GST Rate */}
            <PinkBlueCard 
              onClick={() => setActiveTab("gst")}
              isActive={activeTab === "gst"}
            >
              <div className="flex items-center justify-between mb-2 w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Standard Rate</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Percent className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black font-display text-slate-900">18% GST</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Standard Rate on Services</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>
            </PinkBlueCard>

            {/* CARD 2: GSTR-1 Deadline tracker */}
            <PinkBlueCard 
              onClick={() => setActiveTab("calendar")}
              isActive={activeTab === "calendar"}
            >
              <div className="flex items-center justify-between mb-2 w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Alert</span>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black font-display italic text-slate-900">11th Monthly</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>GSTR-1 Outward Sales deadline</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>
            </PinkBlueCard>

            {/* CARD 3: Notifications list */}
            <PinkBlueCard 
              onClick={() => executeQuickQuestion("What are the latest updates, circulars, and notifications from CBIC and Income Tax Department?")}
            >
              <div className="flex items-center justify-between mb-2 w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grounded Updates</span>
                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black font-display text-slate-900">CBIC Circulars</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Latest Government Notifications</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>
            </PinkBlueCard>

          </div>

          {/* Core AI Workspace Frame with White Background & Shadow */}
          <div className="flex-1 min-h-[480px] p-[1.5px] rounded-[2rem] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 shadow-xl flex flex-col">
            <div className="flex-1 bg-white rounded-[calc(2rem-1.5px)] overflow-hidden flex flex-col">
            
            {/* Workspace Result Header */}
            <div className="px-6 py-4.5 border-b bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></div>
                <span className="text-sm font-semibold text-slate-800">
                  Workspace: <span className="text-pink-600 font-bold">{getTabTitle()}</span>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
                  VERIFIED LAWS FY 2026-27
                </span>
                {expertMode && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold tracking-wider uppercase border border-emerald-200/55">
                    EXPERT RULES ENGINE
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Main Section Workspace views */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/20 min-h-0">
              <AnimatePresence mode="wait">
                
                {/* 1. CHAT WORKSPACE BODY */}
                {activeTab === "chat" && (
                  <motion.div
                    key="chat-panel"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="max-w-4xl mx-auto space-y-5 px-1"
                  >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`w-full flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`rounded-2xl p-5 text-sm leading-relaxed shadow-xs ${
                            msg.role === "user"
                              ? "max-w-[85%] bg-slate-900 text-white rounded-tr-none"
                              : "w-full max-w-none bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5 mb-2.5 text-[10px] opacity-75 font-semibold tracking-wider font-mono">
                            <span>{msg.role === "user" ? "USER INQUIRY" : "TAX INTELLIGENCE AI"}</span>
                            <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className="prose prose-sm max-w-none space-y-2 text-slate-850">
                            <ReactMarkdown
                              components={{
                                table: ({ children }) => (
                                  <div className="my-4 overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-850 bg-white">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    {children}
                                  </thead>
                                ),
                                tbody: ({ children }) => (
                                  <tbody className="bg-white divide-y divide-slate-100">
                                    {children}
                                  </tbody>
                                ),
                                tr: ({ children }) => (
                                  <tr className="hover:bg-slate-50/45 transition-colors">
                                    {children}
                                  </tr>
                                ),
                                th: ({ children }) => (
                                  <th className="px-5 py-3 border-b border-slate-200 font-bold text-left text-slate-800">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-5 py-3.5 text-slate-750 leading-relaxed border-b border-slate-100/75">
                                    {children}
                                  </td>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-base font-black text-slate-900 mt-4 mb-2 tracking-tight">
                                    {children}
                                  </h1>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-bold text-slate-850 mt-3 mb-1.5 tracking-tight border-b pb-1 border-slate-100">
                                    {children}
                                  </h3>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-5 space-y-1 my-2">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-5 space-y-1 my-2">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-slate-700 leading-relaxed">
                                    {children}
                                  </li>
                                ),
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-200/85 text-xs text-slate-500">
                              <p className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-pink-500" /> Grounded Search Verification References:
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {msg.sources.map((src, idx) => (
                                  <a
                                    key={idx}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-pink-600 border border-slate-200 px-2.5 py-1 rounded-md transition text-[11px]"
                                  >
                                    <span>{src.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4.5 max-w-[90%] flex items-center gap-3 shadow-xs">
                          <Loader2 className="w-4.5 h-4.5 text-pink-600 animate-spin" />
                          <span className="text-xs text-slate-500 font-mono">
                            Searching official gazettes, circular archives and assembling fully cited Indian Tax answers...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </motion.div>
                )}


                {/* 2. GST RATE DIRECTORY WORKSPACE */}
                {activeTab === "gst" && (
                  <motion.div
                    key="gst-panel"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="max-w-4xl mx-auto space-y-5"
                  >
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3.5 items-center justify-between">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={gstSearch}
                          onChange={(e) => setGstSearch(e.target.value)}
                          placeholder="Search GST categories or services (e.g., manpower, software)..."
                          className="w-full bg-slate-50 border border-slate-205 rounded-xl pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-800"
                        />
                      </div>
                      <select
                        value={selectedGstRate}
                        onChange={(e) => setSelectedGstRate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-700 w-full md:w-auto"
                      >
                        <option value="All">All Rates</option>
                        <option value="0%">0% (Exempt)</option>
                        <option value="5%">5% Rate</option>
                        <option value="12%">12% Rate</option>
                        <option value="18%">18% Rate (SaaS & IT)</option>
                        <option value="28%">28% Rate</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      {filteredGst.map((gst, idx) => (
                        <PinkBlueCard
                          key={idx}
                          innerClassName="flex-col md:flex-row gap-4"
                        >
                          <div className="flex-1 space-y-3.5">
                            <div className="flex items-center justify-between">
                              <span className="bg-pink-50 text-pink-700 text-xs font-bold px-3 py-1 rounded-md border border-pink-100">
                                {gst.category}
                              </span>
                              <span className="bg-slate-100 text-[10px] text-slate-450 px-2 py-0.5 rounded font-mono">
                                HSN Classification Code Linked
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {gst.items.map((item, idy) => (
                                <div key={idy} className="text-xs text-slate-700 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>

                            <p className="text-xs text-slate-650 leading-relaxed pt-1">
                              <strong>Applicability Scenario:</strong> {gst.applicability}
                            </p>

                            {gst.exceptions && (
                              <div className="text-[11px] bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/40 text-amber-900 flex items-start gap-1.5 font-sans leading-snug">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                                <span><strong>Exemptions & Penal Rules:</strong> {gst.exceptions}</span>
                              </div>
                            )}
                          </div>

                          <div className="md:w-56 flex flex-col md:items-end justify-between md:border-l border-slate-100 md:pl-5 pt-3 md:pt-0 shrink-0">
                            <div className="text-left md:text-right">
                              <span className="text-2xl font-black font-display text-pink-600">{gst.rate}</span>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">GST Rate</p>
                            </div>

                            <button
                              onClick={() => executeQuickQuestion(`What is the precise HSN code, reverse charge applicability, standard threshold registration, and exemptions on: ${gst.category}? Provide step-by-step notes.`)}
                              className="mt-4 inline-flex items-center justify-center gap-1.5 bg-pink-50 text-pink-700 hover:bg-pink-600 hover:text-white border border-pink-205 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all w-full text-center"
                            >
                              <span>Consult AI on this</span>
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </PinkBlueCard>
                      ))}

                      {filteredGst.length === 0 && (
                        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
                          <p className="text-sm text-slate-500">No matching standard categories in local cache.</p>
                          <button
                            onClick={() => executeQuickQuestion(`What is the GST rate, HSN classification, and RCM on "${gstSearch}" under current CBIC schedules?`)}
                            className="mt-3.5 inline-flex items-center gap-1 bg-pink-50 text-pink-700 hover:bg-pink-100 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                          >
                            <span>Search Live GST on Artificial intelligence</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}


                {/* 3. TDS RATE DIRECTORY WORKSPACE */}
                {activeTab === "tds" && (
                  <motion.div
                    key="tds-panel"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="max-w-4xl mx-auto space-y-5"
                  >
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-205 shadow-xs">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={tdsSearch}
                          onChange={(e) => setTdsSearch(e.target.value)}
                          placeholder="Search TDS sections, nature of payment, thresholds (e.g., 194C, rent, 194J)..."
                          className="w-full bg-slate-50 border border-slate-205 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                      {filteredTds.map((tds, idx) => (
                        <PinkBlueCard
                          key={idx}
                          className="h-full"
                          innerClassName="h-full justify-between gap-4 p-5"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="bg-pink-600 text-white font-mono text-xs font-black px-3 py-0.5 rounded-md shadow-xs shadow-pink-600/15">
                                {tds.section}
                              </span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {tds.effectiveDate || "FY 2026-27"}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight font-display">{tds.natureOfPayment}</h4>
                              <p className="text-xs text-slate-500 mt-1 lines-clamp-3 leading-relaxed">
                                {tds.applicability}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                              <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Ind/HUF Rate</span>
                                <span className="text-xs font-black text-slate-800">{tds.rateIndividualHuf}</span>
                              </div>
                              <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Other Entity</span>
                                <span className="text-xs font-black text-slate-800">{tds.rateOthers}</span>
                              </div>
                            </div>

                            <div className="bg-pink-50/40 p-3 rounded-xl border border-pink-100/50 text-xs">
                              <span className="font-bold text-pink-700 block mb-0.5">Threshold Limit</span>
                              <span className="text-slate-750">{tds.threshold}</span>
                            </div>

                            <p className="text-[11px] text-slate-500 italic leading-snug">
                              <strong>Exceptions:</strong> {tds.exceptions}
                            </p>
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">Form Qry compliant</span>
                            <button
                              onClick={() => executeQuickQuestion(`Explain TDS rules for ${tds.section} (${tds.natureOfPayment}). Provide tax rate details, thresholds, and a short calculation example.`)}
                              className="bg-pink-50 text-pink-700 hover:bg-pink-600 hover:text-white border border-pink-205 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                            >
                              <span>Detailed AI Analysis</span>
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </PinkBlueCard>
                      ))}

                      {filteredTds.length === 0 && (
                        <div className="text-center py-12 bg-white border border-dashed border-slate-205 rounded-xl col-span-2">
                          <p className="text-sm text-slate-500">No matching sections found in directory.</p>
                          <button
                            onClick={() => executeQuickQuestion(`Tell me about Income Tax TDS section "${tdsSearch}" rules, withholding rates, limits and compliance deadlines.`)}
                            className="mt-3.5 inline-flex items-center gap-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 px-3.5 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            <span>Query AI for Section "{tdsSearch}"</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}


                {/* 4. TAX CALCULATOR COMPARATOR */}
                {activeTab === "calculator" && (
                  <motion.div
                    key="calculator-panel"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="max-w-4xl mx-auto space-y-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Inputs Column */}
                      <PinkBlueCard className="lg:col-span-12 xl:col-span-5" innerClassName="p-5 justify-start space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">
                          Employer & Income Profile
                        </h4>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-755 flex items-center justify-between">
                            <span>Annual Gross Salary</span>
                            <span className="text-[10px] text-pink-600 font-mono font-bold">Standard deduction applies</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-450 text-sm">₹</span>
                            <input
                              type="number"
                              value={salaryIncome}
                              onChange={(e) => setSalaryIncome(Number(e.target.value))}
                              className="w-full bg-slate-50 focus:bg-white border text-sm rounded-lg pl-7 pr-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-755">Other Income Sources</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-450 text-sm">₹</span>
                            <input
                              type="number"
                              value={otherIncome}
                              onChange={(e) => setOtherIncome(Number(e.target.value))}
                              className="w-full bg-slate-50 focus:bg-white border text-sm rounded-lg pl-7 pr-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug">Bank FD interest, secondary commercial rentals, shares dividends</p>
                        </div>

                        <div className="border-t border-slate-100 pt-3.5 space-y-3">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Old Regime Reductions (Form 16/12BB)
                          </h5>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex justify-between">
                              <span>Sec 80C Payments</span>
                              <span className="text-[10px] text-slate-455">Limit ₹1,50,000</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1.5 text-slate-450 text-xs">₹</span>
                              <input
                                type="number"
                                value={deductions80C}
                                onChange={(e) => setDeductions80C(Number(e.target.value))}
                                className="w-full bg-slate-50 focus:bg-white border text-xs rounded-lg pl-7 pr-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Sec 80D Health Premiums</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1.5 text-slate-450 text-xs">₹</span>
                              <input
                                type="number"
                                value={deductions80D}
                                onChange={(e) => setDeductions80D(Number(e.target.value))}
                                className="w-full bg-slate-50 focus:bg-white border text-xs rounded-lg pl-7 pr-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Other HRA / Interest Deductions</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1.5 text-slate-450 text-xs">₹</span>
                              <input
                                type="number"
                                value={otherDeductions}
                                onChange={(e) => setOtherDeductions(Number(e.target.value))}
                                className="w-full bg-slate-50 focus:bg-white border text-xs rounded-lg pl-7 pr-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                              />
                            </div>
                          </div>
                        </div>
                      </PinkBlueCard>

                      {/* Calculations Results comparator cards */}
                      <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                        
                        <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">💡</span>
                            <div>
                              <p className="text-[10px] font-bold text-pink-700 uppercase tracking-widest">Recommended Choice</p>
                              <h4 className="text-md font-black text-slate-900 leading-tight">
                                File return under <span className="text-pink-600 underline decoration-solid">{bestRegime}</span>
                              </h4>
                            </div>
                          </div>
                          
                          <div className="sm:text-right w-full sm:w-auto">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Est. Annual Tax Savings</span>
                            <span className="text-lg font-black text-emerald-600 font-mono">
                              {formatINR(taxSavings)}
                            </span>
                          </div>
                        </div>

                        {/* Slabs breakdown grids */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Old Regime Summary */}
                          <PinkBlueCard className="h-full" innerClassName="p-4 justify-between" isActive={false}>
                            <div>
                              <div className="flex items-center justify-between border-b pb-2 mb-2 w-full">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Old Tax Regime</span>
                                <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded uppercase font-bold">Standard Deductions limit</span>
                              </div>

                              <div className="space-y-1.5 text-xs text-slate-650">
                                <div className="flex justify-between">
                                  <span>Gross Income:</span>
                                  <span className="font-semibold text-slate-800">{formatINR(salaryIncome + otherIncome)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-emerald-600">Total Deductions:</span>
                                  <span className="font-semibold text-emerald-600">-{formatINR(oldResult.deductions)}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed pb-1.5">
                                  <span className="font-semibold text-slate-800">Taxable Net:</span>
                                  <span className="font-bold text-slate-900">{formatINR(oldResult.taxableIncome)}</span>
                                </div>

                                <div className="flex justify-between pt-1">
                                  <span>Slab Tax total:</span>
                                  <span className="font-mono">{formatINR(oldResult.grossTax)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>Edu Cess (4%):</span>
                                  <span className="font-mono">{formatINR(oldResult.cess)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center mt-4 w-full">
                              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Estimated old Tax</span>
                              <span className="text-base font-black text-slate-700 font-mono">{formatINR(oldResult.totalTax)}</span>
                            </div>
                          </PinkBlueCard>

                          {/* New Regime Summary */}
                          <PinkBlueCard className="h-full" innerClassName="p-4 justify-between" isActive={true}>
                            <div>
                              <div className="flex items-center justify-between border-b border-pink-100 pb-2 mb-2 w-full">
                                <span className="text-xs font-bold text-pink-700 uppercase tracking-wider">New Tax Regime</span>
                                <span className="text-[8px] bg-pink-50 text-pink-700 px-1 py-0.5 rounded font-bold">FY 2025-26 & 2026-27 Revision</span>
                              </div>

                              <div className="space-y-1.5 text-xs text-slate-650">
                                <div className="flex justify-between">
                                  <span>Gross Income:</span>
                                  <span className="font-semibold text-slate-800">{formatINR(salaryIncome + otherIncome)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-emerald-600">Standard Deduction:</span>
                                  <span className="font-semibold text-emerald-600">-{formatINR(newResult.deductions)}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-pink-100 pb-1.5">
                                  <span className="font-semibold text-pink-900">Taxable Net:</span>
                                  <span className="font-bold text-pink-900">{formatINR(newResult.taxableIncome)}</span>
                                </div>

                                <div className="flex justify-between pt-1">
                                  <span>Slab Tax total:</span>
                                  <span className="font-mono">{formatINR(newResult.grossTax)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>Edu Cess (4%):</span>
                                  <span className="font-mono">{formatINR(newResult.cess)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-pink-600 p-2.5 rounded-lg text-center mt-4 text-white shadow-sm w-full">
                              <span className="text-[9px] uppercase font-bold text-pink-100 tracking-wider block">Estimated New Tax</span>
                              <span className="text-base font-black font-mono">{formatINR(newResult.totalTax)}</span>
                            </div>
                          </PinkBlueCard>

                        </div>

                        {/* Slab guidelines alert box */}
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs space-y-2">
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-pink-600" /> Standard Deduction & Rebate Updates matching FY 2025-26 & FY 2026-27
                          </p>
                          <ul className="list-disc pl-5 text-slate-600 space-y-1 text-[11px] leading-relaxed">
                            <li>Standard deduction under the New Regime is <strong>₹75,000</strong> while remaining at <strong>₹50,000</strong> for the Old Regime.</li>
                            <li>Rebate under Section 87A / Tax Threshold: As per the FY 2025-26 budget provisions, there is <strong>nil TDS / tax liabilities up to an income of ₹12,00,000</strong>.</li>
                          </ul>

                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => executeQuickQuestion(`Generate a detailed comparative tax filing advice report in markdown for salary ${formatINR(salaryIncome)} and other earnings ${formatINR(otherIncome)}, including the new ₹12 Lakhs threshold, optimal deductions, exemptions, and budget notifications.`)}
                              className="text-pink-600 font-bold hover:underline text-xs flex items-center gap-1"
                            >
                              <span>Request Customized Expert Report via AI</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  </motion.div>
                )}


                {/* 5. DUE DATES COMPLIANCE REGISTRY */}
                {activeTab === "calendar" && (
                  <motion.div
                    key="calendar-panel"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="max-w-4xl mx-auto space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                      {COMPLIANCE_CALENDAR.map((item, id) => (
                        <PinkBlueCard
                          key={id}
                          className="h-full"
                          innerClassName="p-0 overflow-hidden h-full flex flex-col justify-between"
                        >
                          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between w-full">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.category === "GST"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : item.category === "TDS"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-pink-50 text-pink-700 border-pink-200"
                            }`}>
                              {item.category} Compliance
                            </span>
                            <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase tracking-wider font-mono">
                              {item.period}
                            </span>
                          </div>

                          <div className="p-4.5 space-y-3.5 flex-1 flex flex-col justify-between w-full pb-5">
                            <div>
                              <div className="text-base font-bold text-slate-900 border-b border-pink-50 pb-2 mb-2 flex items-center justify-between w-full">
                                <span>{item.date}</span>
                                <span className="text-xs font-mono text-pink-600">{item.form}</span>
                              </div>
                              <p className="text-xs text-slate-655 leading-relaxed font-sans">{item.description}</p>
                            </div>

                            <button
                              onClick={() => executeQuickQuestion(`What are the penalty schedules, late fees, interest obligations, and rectifying steps if we miss complying or filing ${item.form} before: ${item.date}? Provide a structured checklist.`)}
                              className="text-[11px] text-pink-600 hover:text-pink-800 font-bold hover:underline text-left mt-auto flex items-center gap-1 pt-1.5"
                            >
                              <span>View Late-Filing Penalties with AI</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </PinkBlueCard>
                      ))}
                    </div>

                    <div className="bg-amber-50 text-amber-900 p-4.5 rounded-2xl text-xs flex items-start gap-2.5 border border-amber-200/50">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Urgent Compliance Notice:</p>
                        <p className="mt-1 text-slate-700 leading-relaxed">
                          Late filing of structural TDS returns results in mandatory penalties of ₹200 per day under Section 234E of the Income Tax Act. GST delayed GSTR-3B filings carry severe late fees under Section 47 of the CGST Act. Verify dates meticulously using direct official portals.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Prompt panel fixed at the bottom inside workspace ONLY if chat tab is active */}
            {activeTab === "chat" && (
              <div className="p-4 bg-white border-t shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-3 bg-slate-100 rounded-2xl p-2 pl-4"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask standard limits: 'TDS on Professional Fees' or 'GST on manpower services'..."
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400 placeholder:italic placeholder:text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isTyping}
                    className="w-10 h-10 bg-pink-600 hover:bg-pink-700 text-white rounded-xl flex items-center justify-center shadow-lg hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-center text-slate-400 mt-2.5 uppercase tracking-tighter">
                  Disclaimer: Verify with latest government notifications or a professional advisor before final filing.
                </p>
              </div>
            )}

          </div>
          </div>
        </main>

        {/* Right Sidebar Contextual panel matching design theme layout */}
        <aside className="w-72 bg-slate-50 border-l p-6 shrink-0 overflow-y-auto flex flex-col gap-6 hidden xl:flex">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Compliance Guide
            </h4>
            
            <PinkBlueCard innerClassName="p-4" isActive={false}>
              <p className="text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between w-full">
                <span>Next Duty Deadline</span>
                <span className="text-[10px] bg-red-50 text-red-600 font-black px-1.5 py-0.5 rounded">Urgent</span>
              </p>
              <div className="flex items-center gap-2 mb-3 w-full">
                <span className="text-xs px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">
                  June 07
                </span>
                <span className="text-xs text-slate-500">TDS Monthly Deposit</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: "85%" }}></div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 block">
                85% of monthly buffer elapsed
              </span>
            </PinkBlueCard>
          </div>

          {/* Core Common Questions section */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Common Questions
            </p>
            <div className="space-y-2">
              <button
                onClick={() => executeQuickQuestion("What are the exact GST rates and exemptions applicable to restaurant services and food aggregators?")}
                className="w-full text-left p-3 text-xs bg-white border border-slate-200 rounded-xl hover:border-pink-400 hover:text-pink-600 hover:shadow-xs transition-all text-slate-600 block line-clamp-1"
              >
                • GST on Restaurant Services?
              </button>
              <button
                onClick={() => executeQuickQuestion("What is the threshold limit and TDS rate on professional fees under section 194J?")}
                className="w-full text-left p-3 text-xs bg-white border border-slate-200 rounded-xl hover:border-pink-400 hover:text-pink-600 hover:shadow-xs transition-all text-slate-600 block line-clamp-1"
              >
                • TDS on Professional Fees limit?
              </button>
              <button
                onClick={() => executeQuickQuestion("What are the criteria and registration threshold limits for GST in FY 2026-27?")}
                className="w-full text-left p-3 text-xs bg-white border border-slate-200 rounded-xl hover:border-pink-400 hover:text-pink-600 hover:shadow-xs transition-all text-slate-600 block line-clamp-1"
              >
                • GST threshold limits?
              </button>
              <button
                onClick={() => executeQuickQuestion("Compare Old Tax Regime slab rates with New Tax Regime benefits for salary income under FY 2026-27")}
                className="w-full text-left p-3 text-xs bg-white border border-slate-200 rounded-xl hover:border-pink-400 hover:text-pink-600 hover:shadow-xs transition-all text-slate-600 block line-clamp-1"
              >
                • Compare Old vs New Tax Slabs
              </button>
            </div>
          </div>

          {/* Hindi support module banner in layout block */}
          <PinkBlueCard
            className="mt-auto"
            innerClassName="p-4 bg-gradient-to-tr from-pink-50/60 to-blue-50/20 w-full flex-col items-start gap-1"
          >
            <p className="text-xs font-bold text-pink-800 flex items-center gap-1 w-full">
              <Globe className="w-3.5 h-3.5 text-pink-600 animate-spin-slow" />
              <span>Bilingual Support</span>
            </p>
            <p className="text-[11px] text-slate-655 mt-1 leading-normal w-full">
              Get explanations in both English & Hindi. Simply request: 
            </p>
            <button
              onClick={() => executeQuickQuestion("यह नियम हिंदी में आसान शब्दों में समझाएं।")}
              className="text-[11px] text-pink-700 font-bold mt-2 uppercase tracking-tighter hover:underline block text-left"
            >
              "यह हिंदी में समझाएं" <ArrowRight className="inline w-3 h-3" />
            </button>
          </PinkBlueCard>
        </aside>

      </div>

    </div>
  );
}
