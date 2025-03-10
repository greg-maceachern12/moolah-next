// src/types/index.ts
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

// Base Transaction Types
export interface Transaction {
  date: string
  description: string
  category: string
  amount: number
}

export interface ParsedCSVData {
  data: Record<string, string>[]
  meta: {
    fields: string[]
  }
}

// Financial Data Types
export interface MonthlySpending {
  date: string
  amount: number
}

export interface CategoryBreakdown {
  name: string
  value: number
}

export interface TopMerchant {
  name: string
  amount: number
}

export interface LargestExpense {
  description: string
  amount: number
  date: string
}

export interface DaySpending {
  day: string
  amount: number
}

export interface RecurringPayment {
  description: string
  amount: number
  months: string
}

export interface CategoryTrendItem {
  date: string
  [category: string]: string | number
}

// Component Props
export interface EmptyStateProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
  color?: string
  icon?: ReactNode
}

export interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

// API and Error Types
export interface OpenAIError {
  response?: {
    data: {
      error: {
        message: string
      }
    }
  }
  request?: unknown
  message: string
}

export interface APIResponse {
  response?: string
  error?: string
}

// Utility Types for Processing
export interface SpendingData {
  total: number
  count: number
}

export interface DayOfWeekSpending {
  [key: string]: SpendingData
}

export type CSVType = 'AMEX' | 'Chase' | 'Capital One' | 'Unknown'

export interface TotalMap {
  [key: string]: number
}

// Financial Insight Types
export interface FinancialInsight {
  title: string;
  category: 'spending_pattern' | 'savings_opportunity' | 'risk_alert' | 'behavioral_pattern' | 'optimization';
  description: string;
  recommendation: string;
}

export interface FinancialAnalysisResponse {
  insights: FinancialInsight[];
}

export interface TransactionsRequestBody {
  transactions: Transaction[]
}