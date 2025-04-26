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
import UpsellDialog from "./UpsellDialog";

// OpenAI-inspired colors (adjust as needed)
const colors = {
  background: "bg-gray-50", // Light gray background
  textPrimary: "text-gray-900",
  textSecondary: "text-gray-600",
  accent: "text-blue-600",
  accentBg: "bg-blue-600",
  accentBgLight: "bg-blue-100",
  border: "border-gray-200",
  cardBg: "bg-white",
  iconColor: "text-blue-600",
  buttonText: "text-white",
  buttonHoverBg: "bg-blue-700",
  secondaryButtonBg: "bg-gray-100",
  secondaryButtonHoverBg: "bg-gray-200",
  secondaryButtonText: "text-gray-700",
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <motion.div
    whileHover={{ y: -2 }} // Subtle lift on hover
    className={`${colors.cardBg} rounded-lg p-6 flex items-start space-x-4 shadow-sm ${colors.border} border transition-transform duration-200`}
  >
    <div className={`${colors.accentBgLight} rounded-md p-3`}>
      <Icon className={`w-5 h-5 ${colors.iconColor}`} />
    </div>
    <div>
      <h3 className={`font-semibold ${colors.textPrimary}`}>{title}</h3>
      <p className={`text-sm ${colors.textSecondary} mt-1 leading-normal`}>
        {description}
      </p>
    </div>
  </motion.div>
);

export default function EmptyState({ onFileUpload, onPremiumActivation }: EmptyStateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeSection, setActiveSection] = useState<"help" | null>(null);
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  // const [isPremium, setIsPremium] = useState(false);

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
    // setIsPremium(active);
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
    <div className={`min-h-screen w-full ${colors.background}`}>
      <div className="w-full min-h-screen py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Logo and Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/assets/icon.png"
                alt="Moolah Logo"
                width={48}
                height={48}
              />
              <h1 className={`text-4xl font-semibold ${colors.accent} ml-3`}>
                Moolah
              </h1>
            </div>
            <h2 className={`text-3xl font-semibold ${colors.textPrimary} mb-3`}>
              Understand Your Spending Data
            </h2>
            <p className={`text-lg ${colors.textSecondary} max-w-xl mx-auto`}>
              Upload your bank transactions and get instant insights into your
              spending patterns
            </p>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid gap-8 mb-16"
          >
            <div className="relative">
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={{
                  borderColor: isDragging ? colors.accent : colors.border,
                  backgroundColor: isDragging ? colors.accentBgLight : colors.cardBg,
                }}
                className={`
                  flex flex-col items-center justify-center p-12
                  ${colors.cardBg}
                  border-2 border-dashed rounded-xl
                  ${colors.border}
                  transition-colors duration-200 cursor-pointer
                  hover:border-blue-400
                  shadow-sm
                `}
              >
                <div className={`${colors.accentBgLight} rounded-full p-4 mb-5`}>
                  <Upload className={`w-8 h-8 ${colors.iconColor}`} />
                </div>
                <h2 className={`text-xl font-medium ${colors.textPrimary} mb-2`}>
                  Drop your CSV file here
                </h2>
                <p className={`${colors.textSecondary} mb-6`}>
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
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: colors.buttonHoverBg }}
                    whileTap={{ scale: 0.98 }}
                    className={`${colors.accentBg} ${colors.buttonText} px-6 py-3 rounded-md font-medium
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50
                      focus:ring-offset-2 transition-all duration-200 shadow-sm`}
                    onClick={handleUploadClick}
                  >
                    Select CSV File
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: colors.secondaryButtonHoverBg }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSampleDataClick}
                    className={`${colors.secondaryButtonBg} ${colors.secondaryButtonText} text-sm px-4 py-2 rounded-md
                      flex items-center gap-2 hover:${colors.secondaryButtonHoverBg} transition-colors duration-200 border ${colors.border} shadow-sm`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Try with sample data
                  </motion.button>
                </div>
              </motion.div>

              {/* Privacy Badge */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <div
                  className={`${colors.cardBg} border ${colors.border} rounded-full py-1.5 px-3
                  flex items-center space-x-1.5 shadow-sm`}
                >
                  <Shield className={`w-3.5 h-3.5 ${colors.textSecondary} flex-shrink-0`} />
                  <p className={`${colors.textSecondary} text-xs whitespace-nowrap`}>
                    Your data is processed locally*
                  </p>
                </div>
              </div>
            </div>
            <Payment 
              onValidationSuccess={handlePremiumActivation} 
              onShowUpsell={() => setShowUpsellDialog(true)} 
            />
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-5 mb-16"
          >
            <FeatureCard
              icon={PieChart}
              title="Visual Insights"
              description="See spending patterns through interactive charts and graphs."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Spending Trends"
              description="Track how your spending evolves over time with trend analysis."
            />
            <FeatureCard
              icon={DollarSign}
              title="Category Analysis"
              description="Understand where your money goes with detailed category breakdowns."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Powered"
              description="Get personalized insights based on your spending habits."
            />
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className={`${colors.cardBg} rounded-lg overflow-hidden shadow-sm border ${colors.border}`}
          >
            <motion.div
              className={`flex items-center justify-between p-5 cursor-pointer hover:${colors.secondaryButtonHoverBg} transition-colors duration-200`}
              onClick={() =>
                setActiveSection(activeSection === "help" ? null : "help")
              }
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className={`w-5 h-5 ${colors.iconColor}`} />
                <h3 className={`text-md font-medium ${colors.textPrimary}`}>
                  How to Get Started
                </h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 ${colors.textSecondary} transform transition-transform duration-200 ${
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
                  className={`border-t ${colors.border}`}
                >
                  <div className={`p-6 ${colors.background}`}>
                    <div className={`text-sm ${colors.textSecondary} space-y-5`}>
                      <div>
                        <h4 className={`font-medium ${colors.textPrimary} mb-2`}>
                          Download your transactions:
                        </h4>
                        <ol className="list-decimal list-outside space-y-1.5 ml-4">
                          <li>Log into your online banking</li>
                          <li>Navigate to your account transactions</li>
                          <li>Look for an Export or Download option</li>
                          <li>Select CSV format and your date range</li>
                          <li>Upload the downloaded file here</li>
                        </ol>
                      </div>

                      <div className={`${colors.accentBgLight} rounded-md p-4 border border-blue-200`}>
                        <p className={`${colors.textSecondary} flex items-center text-xs`}>
                          <ExternalLink className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${colors.accent}`} />
                          Supported banks: Chase, American Express, Capital One and more.
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
      <UpsellDialog 
        isOpen={showUpsellDialog}
        onClose={() => setShowUpsellDialog(false)}
      />
    </div>
  );
}
