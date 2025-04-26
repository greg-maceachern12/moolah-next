"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  Sun,
  ShoppingBag,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpDown,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import UpsellDialog from "./UpsellDialog";
import AIInsights from "./AIInsights";
import { Transaction, CategoryTrendItem, RecurringPayment } from "@/lib/types";

// Updated OpenAI-inspired colors for the light theme
const colors = {
  background: "bg-gray-50",
  textPrimary: "text-gray-900",
  textSecondary: "text-gray-600",
  accent: "text-blue-600",
  accentBg: "bg-blue-600",
  accentBgLight: "bg-blue-100",
  border: "border-gray-200",
  cardBg: "bg-white",
  iconColor: "text-blue-600", // Default icon color
  iconColorSecondary: "text-gray-500",
  buttonText: "text-white",
  buttonHoverBg: "bg-blue-700",
  secondaryButtonBg: "bg-gray-100",
  secondaryButtonHoverBg: "bg-gray-200",
  secondaryButtonText: "text-gray-700",
  errorText: "text-red-600",
  successText: "text-green-600",
  tableHeaderBg: "bg-gray-100",
  tableRowHoverBg: "hover:bg-gray-50",
  tooltipBg: "bg-white", // White tooltip background
  tooltipText: "text-gray-700",
  gridStroke: "#E5E7EB", // Lighter grid stroke for charts
};

// Adjusted chart colors for light theme
const CHART_COLORS = [
  "#2563EB", // Blue 600
  "#EA580C", // Orange 600
  "#DC2626", // Red 600
  "#CA8A04", // Yellow 600
  "#6D28D9", // Purple 600
  "#059669", // Green 600
  "#DB2777", // Pink 600
];

interface SpendingDashboardProps {
  transactions: Transaction[];
  fileCount: number;
  isPremium: boolean;
}

export default function SpendingDashboard({ 
  transactions, 
  fileCount, 
  isPremium 
}: SpendingDashboardProps) {
  // State Management
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [monthlySpending, setMonthlySpending] = useState<
    Array<{ date: string; amount: number }>
  >([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [avgMonthlySpend, setAvgMonthlySpend] = useState(0);
  const [avgDailySpend, setAvgDailySpend] = useState(0);
  const [topMerchant, setTopMerchant] = useState({ name: "", amount: 0 });
  const [recurringPayments, setRecurringPayments] = useState<
    RecurringPayment[]
  >([]);
  const [largestExpense, setLargestExpense] = useState({
    description: "",
    amount: 0,
    date: "",
  });
  const [avgSpendingByDayOfWeek, setAvgSpendingByDayOfWeek] = useState<
    Array<{ day: string; amount: number }>
  >([]);
  const [monthOverMonthChange, setMonthOverMonthChange] = useState(0);
  const [yearOverYearChange, setYearOverYearChange] = useState(0);
  const [showYearOverYear, setShowYearOverYear] = useState(false);
  const [hasCategoryData, setHasCategoryData] = useState(false);
  const [categoryTrendData, setCategoryTrendData] = useState<CategoryTrendItem[]>([]);
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);

  const processTransactions = useCallback((transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) {
      console.warn("No transaction data provided");
      return;
    }

    try {
      let totalSpent = 0;
      let totalIncome = 0;
      const merchantTotals: Record<string, number> = {};
      const categoryTotals: Record<string, number> = {};
      const monthlySpendingData: Record<string, number> = {};
      const recurringCandidates: Record<
        string,
        { amount: number; months: number[] }
      > = {};
      const dayOfWeekSpending: Record<
        string,
        { total: number; count: number }
      > = {
        Sun: { total: 0, count: 0 },
        Mon: { total: 0, count: 0 },
        Tue: { total: 0, count: 0 },
        Wed: { total: 0, count: 0 },
        Thu: { total: 0, count: 0 },
        Fri: { total: 0, count: 0 },
        Sat: { total: 0, count: 0 },
      };
      const monthlyTotals: Record<string, number> = {};
      const yearlyTotals: Record<string, number> = {};
      let largestExp = { description: "", amount: 0, date: "" };

      const validDates = transactions
        .map((t) => new Date(t.date))
        .filter((date) => !isNaN(date.getTime()));

      if (validDates.length === 0) {
        throw new Error("No valid dates found in transactions");
      }

      let earliestDate = validDates[0];
      let latestDate = validDates[0];

      transactions.forEach((t) => {
        const transactionDate = new Date(t.date);
        if (isNaN(transactionDate.getTime())) return;

        if (transactionDate < earliestDate) earliestDate = transactionDate;
        if (transactionDate > latestDate) latestDate = transactionDate;

        const amount = Math.abs(t.amount);
        const monthYear = transactionDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (t.amount < 0) {
          // Spending
          totalSpent += amount;
          if (t.description)
            merchantTotals[t.description] =
              (merchantTotals[t.description] || 0) + amount;
          if (t.category)
            categoryTotals[t.category] =
              (categoryTotals[t.category] || 0) + amount;

          const monthYearKey = transactionDate.toISOString().slice(0, 7);
          monthlySpendingData[monthYearKey] =
            (monthlySpendingData[monthYearKey] || 0) + amount;

          if (t.description) {
            const key = `${t.description}-${amount.toFixed(2)}`;
            if (!recurringCandidates[key]) {
              recurringCandidates[key] = { amount, months: [] };
            }
            const monthIndex = transactionDate.getMonth();
            if (!recurringCandidates[key].months.includes(monthIndex)) {
              recurringCandidates[key].months.unshift(monthIndex);
            }
          }

          if (amount > largestExp.amount && t.description) {
            largestExp = {
              description: t.description,
              amount: amount,
              date: t.date,
            };
          }

          const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
            transactionDate.getUTCDay()
          ];
          dayOfWeekSpending[dayOfWeek].total += amount;
          dayOfWeekSpending[dayOfWeek].count += 1;

          const year = transactionDate.toISOString().substring(0, 4);
          monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + amount;
          yearlyTotals[year] = (yearlyTotals[year] || 0) + amount;
        } else {
          totalIncome += amount;
        }
      });

      // Update state with processed data
      setTotalSpent(totalSpent);
      setTotalIncome(totalIncome);
      setStartDate(earliestDate);
      setEndDate(latestDate);
      setLargestExpense(largestExp);

      // Average spending by day of week
      const avgSpending = Object.entries(dayOfWeekSpending).map(
        ([day, data]) => ({
          day,
          amount: data.count > 0 ? data.total / data.count : 0,
        })
      );
      setAvgSpendingByDayOfWeek(avgSpending);

      // Month-over-month change
      const sortedMonths = Object.keys(monthlyTotals).sort();
      if (sortedMonths.length >= 2) {
        const currentMonth =
          monthlyTotals[sortedMonths[sortedMonths.length - 1]] || 0;
        const previousMonth =
          monthlyTotals[sortedMonths[sortedMonths.length - 2]] || 0;
        const momChange =
          previousMonth !== 0
            ? ((currentMonth - previousMonth) / previousMonth) * 100
            : 0;
        setMonthOverMonthChange(momChange);
      }

      // Year-over-year change
      const sortedYears = Object.keys(yearlyTotals).sort();
      if (sortedYears.length >= 2) {
        const currentYear =
          yearlyTotals[sortedYears[sortedYears.length - 1]] || 0;
        const previousYear =
          yearlyTotals[sortedYears[sortedYears.length - 2]] || 0;
        const yoyChange =
          previousYear !== 0
            ? ((currentYear - previousYear) / previousYear) * 100
            : 0;
        setYearOverYearChange(yoyChange);
      }

      // Calculate averages
      const daysDifference = Math.max(
        1,
        (latestDate.getTime() - earliestDate.getTime()) / (1000 * 3600 * 24) + 1
      );
      const monthsDifference = Math.max(
        1,
        (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 +
          (latestDate.getMonth() - earliestDate.getMonth()) +
          1
      );

      setAvgMonthlySpend(totalSpent / monthsDifference);
      setAvgDailySpend(totalSpent / daysDifference);

      // Set top merchant
      const merchantEntries = Object.entries(merchantTotals);
      if (merchantEntries.length > 0) {
        const [name, amount] = merchantEntries.reduce((a, b) =>
          a[1] > b[1] ? a : b
        );
        setTopMerchant({ name, amount });
      }

      // Process category data
      const sortedCategories = Object.entries(categoryTotals).sort(
        (a, b) => b[1] - a[1]
      );

      const hasCategoryData = sortedCategories.length > 0;
      setHasCategoryData(hasCategoryData);

      if (hasCategoryData) {
        const top5Categories = sortedCategories.slice(0, 6); // Show more slices if needed
        const otherCategories = sortedCategories.slice(6);
        const otherTotal = otherCategories.reduce(
          (sum, [, value]) => sum + value,
          0
        );

        const categoryBreakdownData = [
          ...top5Categories.map(([name, value]) => ({ name, value })),
          ...(otherTotal > 0 ? [{ name: "Other", value: otherTotal }] : []),
        ];
        setCategoryBreakdown(categoryBreakdownData);
      } else {
        setCategoryBreakdown([{ name: "Uncategorized", value: totalSpent }]);
      }

      // Category trend data
      const categoryTrendMap: Record<string, Record<string, number>> = {};
      transactions.forEach((t) => {
        if (t.amount < 0) {
          const monthYear = new Date(t.date).toISOString().slice(0, 7);
          if (!categoryTrendMap[monthYear]) {
            categoryTrendMap[monthYear] = {};
          }
          const category = t.category || "Uncategorized";
          categoryTrendMap[monthYear][category] =
            (categoryTrendMap[monthYear][category] || 0) + Math.abs(t.amount);
        }
      });

      const categoryTrendData = Object.entries(categoryTrendMap).map(
        ([date, categories]) => ({
          date,
          ...categories,
        })
      );
      setCategoryTrendData(
        categoryTrendData.sort((a, b) => a.date.localeCompare(b.date))
      );

      // Monthly spending data
      const sortedMonthlySpending = Object.entries(monthlySpendingData)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, amount]) => ({ date, amount }));
      setMonthlySpending(sortedMonthlySpending);

      // Recurring payments
      const recurringThreshold = 3;
      const recurring = Object.entries(recurringCandidates)
        .filter(([, data]) => data.months.length >= recurringThreshold)
        .map(([key, data]) => ({
          description: key.split("-")[0],
          amount: data.amount,
          months: data.months
            .sort((a, b) => a - b)
            .map((m) =>
              new Date(0, m).toLocaleString("default", { month: "short" })
            )
            .join(", "),
        }))
        .sort((a, b) => b.amount - a.amount);
      setRecurringPayments(recurring);
    } catch (error) {
      console.error("Error processing transactions:", error);
      // Set default values for critical states
      setTotalSpent(0);
      setTotalIncome(0);
      setAvgMonthlySpend(0);
      setAvgDailySpend(0);
      setTopMerchant({ name: "Error processing data", amount: 0 });
      setCategoryBreakdown([{ name: "Error", value: 0 }]);
      setMonthlySpending([]);
      setRecurringPayments([]);
    }
  }, []);

  // Process transactions when component mounts or when transactions change
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      processTransactions(transactions);
    }
  }, [transactions, processTransactions]);

  const toggleChangeMetric = () => {
    setShowYearOverYear(!showYearOverYear);
  };

  const formatDollarAmount = (amount: number): string => {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateLabel = (() => {
        if (!label) return "";
        // Attempt to format based on assumed input (e.g., 'YYYY-MM' or 'Day')
        if (typeof label === 'string' && label.includes('-')) {
          const [year, month] = label.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        }
        return label; // Return label as is if format is unknown
      })();

      return (
        <div className={`${colors.tooltipBg} p-3 shadow-lg rounded-md border ${colors.border} opacity-95`}>
          <p className={`label ${colors.textPrimary} font-medium mb-1`}>{dateLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className={`intro ${colors.textSecondary} text-sm`} style={{ color: entry.color }}>
              {`${entry.name}: ${formatDollarAmount(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen w-full ${colors.background} animate-fade-in duration-500`}>
      <div className="w-full min-h-screen py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
              <div className="flex items-center">
                <Image
                  src="/assets/icon.png"
                  alt="Moolah Logo"
                  width={40}
                  height={40}
                />
                <h1 className={`text-3xl sm:text-4xl font-semibold ${colors.accent} ml-2.5`}>
                  Moolah Dashboard
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm ${colors.textSecondary}">
              {fileCount > 0 && (
                <div className="flex items-center">
                  <FileText className={`w-4 h-4 mr-1.5 ${colors.iconColorSecondary}`} />
                  <span>{fileCount} file(s) selected</span>
                </div>
              )}
              {startDate && endDate && (
                <div className="flex items-center">
                  <Calendar className={`w-4 h-4 mr-1.5 ${colors.iconColorSecondary}`} />
                  <span>
                    {startDate.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })} - 
                    {endDate.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
              {[ 
                { title: "Avg. Monthly Spend", value: avgMonthlySpend, icon: Calendar, color: colors.accent },
                { title: "Avg. Daily Spend", value: avgDailySpend, icon: Sun, color: 'text-orange-600' },
                { title: "Total Spent", value: totalSpent, icon: TrendingDown, color: colors.errorText },
                { title: "Total Income", value: totalIncome, icon: TrendingUp, color: colors.successText },
              ].map(metric => (
                <div key={metric.title} className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border}`}> 
                  <div className="flex items-center justify-between mb-2">
                    <h2 className={`text-sm font-medium ${colors.textSecondary}`}>{metric.title}</h2>
                    <metric.icon className={`w-5 h-5 ${colors.iconColorSecondary}`} />
                  </div>
                  <p className={`text-2xl font-semibold ${metric.color}`}>{formatDollarAmount(metric.value)}</p>
                </div>
              ))}
              
              <div className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className={`text-sm font-medium ${colors.textSecondary}`}>Top Merchant</h2>
                  <ShoppingBag className={`w-5 h-5 ${colors.iconColorSecondary}`} />
                </div>
                <p className={`text-lg font-semibold ${colors.textPrimary} truncate`} title={topMerchant.name}>{topMerchant.name || '-'}</p>
                <p className={`text-xl font-semibold ${colors.accent}`}>{formatDollarAmount(topMerchant.amount)}</p>
              </div>

              <div className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className={`text-sm font-medium ${colors.textSecondary}`}>Largest Transaction</h2>
                  <DollarSign className={`w-5 h-5 ${colors.iconColorSecondary}`} />
                </div>
                <p className={`text-lg font-semibold ${colors.textPrimary} truncate`} title={largestExpense.description}>{largestExpense.description || '-'}</p>
                <p className={`text-xl font-semibold ${colors.errorText}`}>{formatDollarAmount(largestExpense.amount)}</p>
                {largestExpense.date && <p className={`text-xs ${colors.textSecondary} mt-1`}>{new Date(largestExpense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
              </div>

              <div className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border} relative`}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className={`text-sm font-medium ${colors.textSecondary}`}>
                    {showYearOverYear ? "YoY Change" : "MoM Change"}
                  </h2>
                  <ArrowUpDown className={`w-5 h-5 ${colors.iconColorSecondary}`} />
                </div>
                <p
                  className={`text-2xl font-semibold ${
                    (showYearOverYear ? yearOverYearChange : monthOverMonthChange) >= 0
                      ? colors.errorText 
                      : colors.successText 
                  }`}
                >
                  {(showYearOverYear ? yearOverYearChange : monthOverMonthChange).toFixed(1)}%
                </p>
                <button
                  onClick={toggleChangeMetric}
                  className={`absolute bottom-3 right-3 px-2 py-0.5 text-[10px] ${colors.secondaryButtonBg} ${colors.secondaryButtonText} rounded border ${colors.border} hover:${colors.secondaryButtonHoverBg} transition-colors`}
                >
                  View {showYearOverYear ? "MoM" : "YoY"}
                </button>
              </div>
            </div>

            <AIInsights 
              transactions={transactions}
              isPremium={isPremium}
              onShowUpsell={() => setShowUpsellDialog(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border}`}> 
                <h2 className={`text-base font-semibold ${colors.textPrimary} mb-4`}> 
                  Monthly Spending Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlySpending} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(tick) => {
                        const [year, month] = tick.split('-');
                        return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
                      }}
                      stroke={colors.textSecondary}
                      fontSize={12}
                    />
                    <YAxis stroke={colors.textSecondary} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="amount" name="Spending" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0], r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border}`}> 
                <h2 className={`text-base font-semibold ${colors.textPrimary} mb-4`}> 
                  Spending by Category
                </h2>
                {hasCategoryData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        fontSize={12}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`flex items-center justify-center h-[300px] ${colors.textSecondary} ${colors.secondaryButtonBg} rounded-md border ${colors.border}`}> 
                    Category data not available
                  </div>
                )}
              </div>

              <div className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border}`}> 
                <h2 className={`text-base font-semibold ${colors.textPrimary} mb-4`}> 
                  Avg Spending by Day
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgSpendingByDayOfWeek} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                    <XAxis dataKey="day" stroke={colors.textSecondary} fontSize={12} />
                    <YAxis stroke={colors.textSecondary} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="amount" name="Avg Spending" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border}`}> 
                <h2 className={`text-base font-semibold ${colors.textPrimary} mb-4`}> 
                  Category Spending Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryTrendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(tick) => {
                         const [year, month] = tick.split('-');
                         return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
                      }}
                      stroke={colors.textSecondary}
                      fontSize={12}
                    />
                    <YAxis stroke={colors.textSecondary} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {categoryBreakdown.map((category, index) => (
                      <Bar
                        key={category.name}
                        dataKey={category.name}
                        stackId="a"
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        radius={index === categoryBreakdown.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${colors.cardBg} p-5 rounded-lg shadow-sm border ${colors.border} overflow-hidden`}> 
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-base font-semibold ${colors.textPrimary}`}> 
                  Recurring Payments (Detected)
                </h2>
                <RefreshCw className={`w-5 h-5 ${colors.iconColorSecondary}`} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={colors.tableHeaderBg}> 
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}> 
                        Description
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}> 
                        Amount
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}> 
                        Months Charged
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`bg-white divide-y divide-gray-200`}>
                    {recurringPayments.length > 0 ? recurringPayments.map((payment, index) => (
                      <tr key={index} className={`${colors.tableRowHoverBg} transition-colors`}> 
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${colors.textPrimary}`}> 
                          {payment.description}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${colors.textPrimary} font-medium`}> 
                          {formatDollarAmount(payment.amount)}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${colors.textSecondary}`}> 
                          {payment.months}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className={`px-4 py-4 text-center text-sm ${colors.textSecondary}`}> 
                          No recurring payments detected (requires 3+ months of data).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <UpsellDialog 
            isOpen={showUpsellDialog}
            onClose={() => setShowUpsellDialog(false)}
          />
        </div>
      </div>
    </div>
  );
}
