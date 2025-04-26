import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { Transaction, FinancialAnalysisResponse, FinancialInsight } from '@/lib/types';

interface AIInsightsProps {
  transactions: Transaction[];
  isPremium: boolean;
  onShowUpsell: () => void;
}

// OpenAI-inspired colors (consistent with EmptyState)
const colors = {
  background: "bg-gray-50",
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
  errorText: "text-red-600",
  errorBgLight: "bg-red-50",
  errorBorder: "border-red-200",
  successText: "text-green-600",
  successBgLight: "bg-green-50",
  successBorder: "border-green-200",
  warningText: "text-yellow-600",
  warningBgLight: "bg-yellow-50",
  warningBorder: "border-yellow-200",
  infoText: "text-purple-600", // Using purple for 'optimization'
  infoBgLight: "bg-purple-50",
  infoBorder: "border-purple-200",
};

export default function AIInsights({ transactions, isPremium, onShowUpsell }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<FinancialAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [additionalNotes, setadditionalNotes] = useState('');

  const handleAIInsightsClick = async () => {
    if (!isPremium) {
      onShowUpsell();
      return;
    }
    
    setIsLoading(true);
    setAiInsights(null);
    setError(null);
    try {
      const response = await fetch("/api/financial-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          transactions,
          additionalNotes: additionalNotes.trim() 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API call failed");
      }

      const data = await response.json();
      setAiInsights(data);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Updated category styling for the light theme
  const getCategoryStyle = (category: string): { text: string; bg: string; border: string } => {
    switch (category) {
      case 'spending_pattern': return { text: colors.accent, bg: colors.accentBgLight, border: 'border-blue-200' };
      case 'savings_opportunity': return { text: colors.successText, bg: colors.successBgLight, border: colors.successBorder };
      case 'risk_alert': return { text: colors.errorText, bg: colors.errorBgLight, border: colors.errorBorder };
      case 'behavioral_pattern': return { text: colors.warningText, bg: colors.warningBgLight, border: colors.warningBorder };
      case 'optimization': return { text: colors.infoText, bg: colors.infoBgLight, border: colors.infoBorder };
      default: return { text: colors.textSecondary, bg: colors.secondaryButtonBg, border: colors.border };
    }
  };

  const getCategoryIcon = (category: string) => {
    const style = getCategoryStyle(category);
    switch (category) {
      case 'spending_pattern': return <TrendingUp className={`w-4 h-4 ${style.text}`} />;
      case 'savings_opportunity': return <Sparkles className={`w-4 h-4 ${style.text}`} />;
      case 'risk_alert': return <AlertTriangle className={`w-4 h-4 ${style.text}`} />;
      case 'behavioral_pattern': return <TrendingUp className={`w-4 h-4 ${style.text}`} />;
      case 'optimization': return <RefreshCw className={`w-4 h-4 ${style.text}`} />;
      default: return <Sparkles className={`w-4 h-4 ${style.text}`} />;
    }
  };

  const renderInsight = (insight: FinancialInsight) => {
    const categoryStyle = getCategoryStyle(insight.category);
    return (
      // Use card background for each insight item if CollapsibleSection doesn't provide one
      // Or adjust padding/borders if CollapsibleSection provides the card background
      <div className={`py-4 border-b ${colors.border} last:border-b-0`}> 
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${categoryStyle.bg} p-1.5 rounded-md border ${categoryStyle.border}`}> 
            {getCategoryIcon(insight.category)}
          </div>
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h4 className={`text-base font-medium ${colors.textPrimary}`}>
                {insight.title}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
                {insight.category.replace('_', ' ')}
              </span>
            </div>
            <p className={`text-sm ${colors.textSecondary} mb-3 leading-normal`}>
              {insight.description}
            </p>
            {/* Restyled recommendation box */}
            <div className={`${colors.secondaryButtonBg} rounded-md p-3 border ${colors.border}`}> 
              <p className={`text-sm ${colors.textSecondary} flex items-start gap-2`}>
                <span className={`font-medium ${colors.accent} flex-shrink-0`}>Tip:</span> 
                <span>{insight.recommendation}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6"> {/* Adjusted margin */}
      {/* Assume CollapsibleSection is updated or handles its own styling */}
      <CollapsibleSection
        title="AI Insights"
        defaultExpanded={true} 
        // Pass theme colors or rely on CollapsibleSection's internal styling
        icon={<Sparkles className={`w-4 h-4 ${colors.iconColor} ${isLoading ? 'animate-pulse' : ''}`} />} // Use theme icon color
      >
        {/* Use card background and border for the content area */}
        <div className={`${colors.cardBg} rounded-b-lg border ${colors.border} border-t-0 overflow-hidden`}> 
          {!aiInsights && !error ? (
            <div className="w-full flex flex-col items-center justify-center space-y-4 p-8"> {/* Adjusted padding */}
              {/* Simplified loading/initial state indicator */}
              <div className={`${colors.accentBgLight} p-4 rounded-full border border-blue-200 ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? (
                  <RefreshCw className={`w-8 h-8 ${colors.iconColor} animate-spin`} />
                ) : (
                  <Sparkles className={`w-8 h-8 ${colors.iconColor}`} />
                )}
              </div>
              <div className="text-center">
                <p className={`text-base font-medium ${colors.textPrimary} mb-1`}>
                  {isLoading ? 'Generating AI insights...' : 'Get AI-Powered Financial Insights'}
                </p>
                <p className={`text-sm ${colors.textSecondary}`}>
                  {isLoading ? 'This may take a moment...' : 'Discover spending patterns and opportunities'}
                </p>
              </div>
              
              {!isLoading && (
                <div className="w-full max-w-sm flex items-center gap-3 mt-4"> {/* Added margin-top */}
                  <input
                    type="text"
                    value={additionalNotes}
                    onChange={(e) => setadditionalNotes(e.target.value)}
                    placeholder="Add context (e.g., saving goal)" // Improved placeholder
                    className={`flex-grow px-3 py-2 ${colors.cardBg} border ${colors.border} rounded-md text-sm ${colors.textPrimary} placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm`} // Restyled input
                  />
                  
                  {/* Restyled button */}
                  <button
                    onClick={handleAIInsightsClick}
                    disabled={isLoading}
                    className={`px-4 py-2 ${colors.secondaryButtonBg} hover:${colors.secondaryButtonHoverBg} ${colors.secondaryButtonText} text-sm font-medium rounded-md transition-colors border ${colors.border} shadow-sm`} 
                  >
                    Analyze
                  </button>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="p-5"> {/* Adjusted padding */}
              <div className={`flex items-center gap-2 mb-2 ${colors.errorText}`}>
                <AlertTriangle className="w-5 h-5" /> {/* Slightly larger icon */}
                <span className="font-medium text-base">Analysis Error</span> {/* Adjusted text size */}
              </div>
              {/* Restyled error box */}
              <p className={`text-sm ${colors.errorText} mb-3 ${colors.errorBgLight} p-3 rounded-md border ${colors.errorBorder}`}> 
                {error}
              </p>
              {/* Restyled retry button */}
              <button 
                onClick={handleAIInsightsClick}
                className={`flex items-center ${colors.accent} hover:text-blue-700 transition-colors font-medium text-sm`}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Try again
              </button>
            </div>
          ) : (
            // Apply padding inside the container if renderInsight doesn't handle it
            <div className="divide-y divide-gray-200 px-5"> 
              {aiInsights?.insights?.map((insight, index) => (
                // Removed redundant key div wrapper
                <div key={index}>
                  {renderInsight(insight)}
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}