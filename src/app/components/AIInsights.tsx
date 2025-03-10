import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Plus } from 'lucide-react';
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
      case 'spending_pattern': return 'text-blue-600 bg-blue-100';
      case 'savings_opportunity': return 'text-green-600 bg-green-100';
      case 'risk_alert': return 'text-red-600 bg-red-100';
      case 'behavioral_pattern': return 'text-yellow-600 bg-yellow-100';
      case 'optimization': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderInsight = (insight: FinancialInsight) => {
    return (
      <div className="py-3 border-b border-gray-100 last:border-b-0">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-1">
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-base font-medium text-gray-800">
                {insight.title}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-opacity-15 ${getCategoryColor(insight.category)} bg-${insight.category.split('_')[0]}-100`}>
                {insight.category.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {insight.description}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Tip:</span> {insight.recommendation}
            </p>
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
        icon={<Sparkles className="w-4 h-4 text-yellow-500" />}
      >
        {!aiInsights && !error ? (
          <button
            onClick={handleAIInsightsClick}
            disabled={isLoading}
            className="w-full flex flex-col items-center justify-center space-y-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="bg-indigo-100 bg-opacity-50 p-2 rounded-full">
              {isLoading ? (
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              ) : (
                <Plus className="w-8 h-8 text-indigo-500" />
              )}
            </div>
            <p className="text-base font-semibold text-indigo-600 animate-pulse">
              {isLoading ? 'Generating AI insights...' : 'Click to see AI insights'}
            </p>
          </button>
        ) : error ? (
          <div className="p-3 text-sm text-red-600">
            <div className="flex items-center mb-1">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="font-medium">Error:</span>
            </div>
            <p>{error}</p>
            <button 
              onClick={handleAIInsightsClick}
              className="mt-2 text-indigo-600 hover:text-indigo-800"
            >
              Try again
            </button>
          </div>
        ) : (
          <div>
            {aiInsights?.insights?.map((insight) => (
              <div key={insight.title}>
                {renderInsight(insight)}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}