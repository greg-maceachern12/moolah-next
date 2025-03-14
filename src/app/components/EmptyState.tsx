"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Upload,
  ChevronDown,
  DollarSign,
  PieChart,
  TrendingUp,
  Sparkles,
  HelpCircle,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";
import { EmptyStateProps, FeatureCardProps } from "@/lib/types";
import Payment from "./Payment";

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-slate-800/70 backdrop-filter backdrop-blur-sm rounded-xl p-6 flex items-start space-x-4 
      shadow-sm border border-slate-700/50 hover:shadow-md hover:border-[#f2923d]/30 
      hover:bg-slate-800/80 transition-all duration-300"
  >
    <div className="rounded-lg bg-[#287FAD]/20 p-3 border border-[#287FAD]/20">
      <Icon className="w-6 h-6 text-[#287FAD]" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-100">{title}</h3>
      <p className="text-sm text-gray-300 mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  </motion.div>
);

export default function EmptyState({ onFileUpload, onPremiumActivation }: EmptyStateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeSection, setActiveSection] = useState<"help" | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const syntheticEvent = {
        target: { files },
      } as React.ChangeEvent<HTMLInputElement>;
      onFileUpload(syntheticEvent);
    }
  };

  const handleUploadClick = () => {
    const uploadInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    if (uploadInput) {
      uploadInput.click();
    }
  };

  const handlePremiumActivation = (active: boolean) => {
    setIsPremium(active);
    if (onPremiumActivation) {
      onPremiumActivation(active);
    }
  };

  const handleSampleDataClick = async () => {
    try {
      const response = await fetch("/sample-transactions.csv");
      const csvText = await response.text();
      const file = new File([csvText], "sample-transactions.csv", {
        type: "text/csv",
      });

      const input = document.createElement("input");
      input.type = "file";

      const event = new Event("change", { bubbles: true });
      Object.defineProperty(input, "files", {
        value: [file],
      });

      const syntheticEvent = {
        ...event,
        target: input,
        currentTarget: input,
        persist: () => {},
        preventDefault: () => {},
        stopPropagation: () => {},
        nativeEvent: event,
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      onFileUpload(syntheticEvent);
    } catch (error) {
      console.error("Error loading sample data:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[url('/assets/bg.png')] bg-cover bg-center bg-fixed bg-no-repeat">
      <div className="w-full h-full min-h-screen backdrop-blur-2xl backdrop-filter backdrop-saturate-150 py-12 px-4 bg-black/50 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Logo and Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/assets/icon.png"
                alt="Moolah Logo"
                width={60}
                height={60}
              />
              <h1 className="text-5xl font-bold text-[#287FAD] ml-3">
                Moolah
              </h1>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Understand Your Spending Data
            </h2>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Upload your bank transactions and get instant insights into your
              spending patterns
            </p>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid gap-6 mb-12"
          >
            <div className="relative">
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={{
                  scale: isDragging ? 1.02 : 1,
                  borderColor: isDragging ? "#f2923d" : "rgba(100, 116, 139, 0.5)",
                }}
                className={`
                  flex flex-col items-center justify-center p-16
                  bg-slate-800/70 backdrop-filter backdrop-blur-sm
                  border-2 rounded-2xl
                  ${
                    isDragging
                      ? "border-[#f2923d] bg-[#f2923d]/10"
                      : "border-slate-700/50 bg-slate-800/70"
                  }
                  transition-all duration-200 cursor-pointer
                  hover:border-[#f2923d]/50 hover:bg-slate-800/80
                  shadow-xl
                `}
              >
                <div className="bg-slate-900/80 rounded-full p-5 mb-6 border border-[#f2923d]/20">
                  <Upload className="w-10 h-10 text-[#f2923d]" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-100 mb-3">
                  Drop your CSV file here
                </h2>
                <p className="text-gray-300 mb-6">
                  or click to browse from your computer
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={onFileUpload}
                  accept=".csv"
                  multiple
                  aria-label="Upload CSV file"
                />
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-[#f2923d] to-[#e07e2d] text-white px-8 py-4 rounded-xl font-medium 
                      hover:from-[#e07e2d] hover:to-[#d06e1d] focus:outline-none focus:ring-2 focus:ring-[#f2923d]/50 
                      focus:ring-offset-2 transition-all duration-200 shadow-md"
                    onClick={handleUploadClick}
                  >
                    Select CSV File
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSampleDataClick}
                    className="text-gray-300 text-sm px-4 py-2 rounded-lg 
                      flex items-center gap-2 hover:bg-slate-700/50 transition-colors duration-200 border border-transparent hover:border-slate-600"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Try with sample data
                  </motion.button>
                </div>
              </motion.div>

              {/* Privacy Badge */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <div
                  className="bg-slate-900/80 backdrop-filter backdrop-blur-sm border border-[#D9A566]/30 rounded-full py-2 px-4 
                  flex items-center space-x-2 shadow-sm"
                >
                  <Shield className="w-4 h-4 text-[#D9A566] flex-shrink-0" />
                  <p className="text-gray-300 text-sm whitespace-nowrap">
                    Your data is processed locally*
                  </p>
                </div>
              </div>
            </div>
            <Payment onValidationSuccess={handlePremiumActivation} />
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-6 mb-12"
          >
            <FeatureCard
              icon={PieChart}
              title="Visual Insights"
              description="See your spending patterns through beautiful, interactive charts and graphs"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Spending Trends"
              description="Track how your spending evolves over time with detailed trend analysis"
            />
            <FeatureCard
              icon={DollarSign}
              title="Category Analysis"
              description="Understand exactly where your money goes with detailed category breakdowns"
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Powered"
              description="Get personalized insights and recommendations based on your spending habits"
            />
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-slate-800/70 backdrop-filter backdrop-blur-sm rounded-xl overflow-hidden shadow-md border border-slate-700/50"
          >
            <motion.div
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-700/50 transition-colors duration-200"
              onClick={() =>
                setActiveSection(activeSection === "help" ? null : "help")
              }
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-[#287FAD]" />
                <h3 className="text-lg font-semibold text-gray-100">
                  How to Get Started
                </h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-300 transform transition-transform duration-200 ${
                  activeSection === "help" ? "rotate-180" : ""
                }`}
              />
            </motion.div>

            <AnimatePresence>
              {activeSection === "help" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-slate-700/50"
                >
                  <div className="p-6 bg-slate-800/50">
                    <div className="text-sm text-gray-300 space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-100 mb-2">
                          Download your transactions:
                        </h4>
                        <ol className="list-decimal list-inside space-y-2">
                          <li className="flex items-baseline space-x-2">
                            <span>1.</span>
                            <span>Log into your online banking</span>
                          </li>
                          <li className="flex items-baseline space-x-2">
                            <span>2.</span>
                            <span>Navigate to your account transactions</span>
                          </li>
                          <li className="flex items-baseline space-x-2">
                            <span>3.</span>
                            <span>Look for an Export or Download option</span>
                          </li>
                          <li className="flex items-baseline space-x-2">
                            <span>4.</span>
                            <span>Select CSV format and your date range</span>
                          </li>
                          <li className="flex items-baseline space-x-2">
                            <span>5.</span>
                            <span>Upload the downloaded file here</span>
                          </li>
                        </ol>
                      </div>

                      <div className="bg-slate-900/70 backdrop-filter backdrop-blur-sm rounded-lg p-4 border border-[#A13D63]/20">
                        <p className="text-gray-200 flex items-center">
                          <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0 text-[#A13D63]" />
                          Supported banks: Chase, American Express, Capital One and
                          more
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
