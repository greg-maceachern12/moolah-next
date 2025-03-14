import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { Transaction, FinancialAnalysisResponse, FinancialInsight } from '@/lib/types';

interface AIInsightsProps {
  transactions: Transaction[];
  isPremium: boolean;
  onShowUpsell: () => void;
}

export default function AIInsights({ transactions, isPremium, onShowUpsell }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<FinancialAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ transactions }),
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spending_pattern': return 'text-blue-300 bg-blue-900/30 border border-blue-700/30';
      case 'savings_opportunity': return 'text-green-300 bg-green-900/30 border border-green-700/30';
      case 'risk_alert': return 'text-red-300 bg-red-900/30 border border-red-700/30';
      case 'behavioral_pattern': return 'text-yellow-300 bg-yellow-900/30 border border-yellow-700/30';
      case 'optimization': return 'text-purple-300 bg-purple-900/30 border border-purple-700/30';
      default: return 'text-gray-300 bg-gray-800/30 border border-gray-700/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spending_pattern': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'savings_opportunity': return <Sparkles className="w-4 h-4 text-green-400" />;
      case 'risk_alert': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'behavioral_pattern': return <TrendingUp className="w-4 h-4 text-yellow-400" />;
      case 'optimization': return <RefreshCw className="w-4 h-4 text-purple-400" />;
      default: return <Sparkles className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderInsight = (insight: FinancialInsight) => {
    return (
      <div className="py-4 border-b border-slate-700/50 last:border-b-0">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1 bg-slate-800 p-1.5 rounded-full">
            {getCategoryIcon(insight.category)}
          </div>
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h4 className="text-base font-medium text-gray-100">
                {insight.title}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(insight.category)}`}>
                {insight.category.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              {insight.description}
            </p>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-sm text-gray-300 flex items-start gap-2">
                <span className="font-medium text-[#f2923d] flex-shrink-0">Tip:</span> 
                <span>{insight.recommendation}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6">
      <CollapsibleSection
        title="AI Insights"
        defaultExpanded={true}
        icon={<Sparkles className="w-4 h-4 text-[#f2923d]" />}
      >
        <div className="bg-slate-800/70 backdrop-filter backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden">
          {!aiInsights && !error ? (
            <button
              onClick={handleAIInsightsClick}
              disabled={isLoading}
              className="w-full flex flex-col items-center justify-center space-y-4 focus:outline-none focus:ring-2 focus:ring-[#f2923d] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed p-8 hover:bg-slate-800/90 transition-colors"
            >
              <div className="bg-gradient-to-br from-[#f2923d]/20 to-[#287FAD]/20 p-4 rounded-full border border-[#f2923d]/30">
                {isLoading ? (
                  <RefreshCw className="w-8 h-8 text-[#f2923d] animate-spin" />
                ) : (
                  <Sparkles className="w-8 h-8 text-[#f2923d]" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-100 mb-1">
                  {isLoading ? 'Generating AI insights...' : 'Get AI-Powered Financial Insights from OpenAI'}
                </p>
                <p className="text-sm text-gray-400">
                  {isLoading ? 'This may take a moment...' : 'Discover spending patterns and optimization opportunities'}
                </p>
              </div>
              {!isLoading && (
                <div className="flex items-center text-[#f2923d] text-sm font-medium mt-2">
                  <span>Click to analyze</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              )}
            </button>
          ) : error ? (
            <div className="p-5 text-sm">
              <div className="flex items-center gap-2 mb-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium text-lg">Analysis Error</span>
              </div>
              <p className="text-gray-300 mb-4 bg-red-900/20 p-3 rounded-lg border border-red-800/30">
                {error}
              </p>
              <button 
                onClick={handleAIInsightsClick}
                className="flex items-center text-[#f2923d] hover:text-[#e07e2d] transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {aiInsights?.insights?.map((insight, index) => (
                <div key={index} className="px-5">
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