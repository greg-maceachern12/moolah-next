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

const COLORS = [
  "#287FAD",  // Blue
  "#f2923d",  // Orange
  "#A13D63",  // Rich Burgundy/Maroon (replaced Purple)
  "#D9A566",  // Soft Gold/Amber (replaced Sage Green)
  "#287FAD",  // Blue (repeated)
  "#f2923d",  // Orange (repeated)
  "#A13D63",  // Rich Burgundy/Maroon (repeated)
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
        const top5Categories = sortedCategories.slice(0, 4);
        const otherCategories = sortedCategories.slice(4);
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-slate-900 to-zinc-800 bg-opacity-95 bg-blend-overlay relative animate-fade-in duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(#3a3a3a_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.15] animate-fade-in"></div>
      <div className="w-full h-full min-h-screen backdrop-blur-md backdrop-filter backdrop-saturate-150 py-12 px-6 bg-black/20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <Image
                  src="/assets/icon.png"
                  alt="Moolah Logo"
                  width={50}
                  height={50}
                />
                <h1 className="text-3xl sm:text-4xl font-bold text-[#287FAD] ml-3">
                  Moolah
                </h1>
              </div>
            </div>
            {fileCount > 0 && (
              <div className="text-sm text-gray-200 flex items-center mt-2">
                <FileText className="w-4 h-4 mr-2 text-[#f2923d]" />
                <span>{fileCount} file(s) selected</span>
              </div>
            )}
            {startDate && endDate && (
              <div className="text-sm text-gray-200 flex items-center mt-2">
                <Calendar className="w-4 h-4 mr-2 text-[#f2923d]" />
                <span>
                  From{" "}
                  {startDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  to{" "}
                  {endDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-8 animate-fade-in">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Avg. Monthly Spend
                  </h2>
                  <Calendar className="w-6 h-6 text-[#287FAD]" />
                </div>
                <p className="text-3xl font-bold text-[#287FAD]">
                  {formatDollarAmount(avgMonthlySpend)}
                </p>
              </div>

              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Avg. Daily Spend
                  </h2>
                  <Sun className="w-6 h-6 text-[#f2923d]" />
                </div>
                <p className="text-3xl font-bold text-[#f2923d]">
                  {formatDollarAmount(avgDailySpend)}
                </p>
              </div>

              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Top Merchant
                  </h2>
                  <ShoppingBag className="w-6 h-6 text-[#A13D63]" />
                </div>
                <p className="text-xl font-bold text-gray-100">
                  {topMerchant.name}
                </p>
                <p className="text-2xl font-bold text-[#A13D63]">
                  {formatDollarAmount(topMerchant.amount)}
                </p>
              </div>

              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Largest Transaction
                  </h2>
                  <DollarSign className="w-6 h-6 text-[#f2923d]" />
                </div>
                <p className="text-xl font-bold text-gray-100">
                  {largestExpense.description}
                </p>
                <p className="text-2xl font-bold text-[#f2923d]">
                  {formatDollarAmount(largestExpense.amount)}
                </p>
                <p className="text-sm text-gray-300">
                  {new Date(largestExpense.date).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50 relative">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-100">
                    {showYearOverYear
                      ? "Year-over-Year Change"
                      : "Month-over-Month Change"}
                  </h2>
                  <ArrowUpDown className="w-6 h-6 text-[#287FAD]" />
                </div>
                <p
                  className={`text-3xl font-bold ${
                    (showYearOverYear
                      ? yearOverYearChange
                      : monthOverMonthChange) >= 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {(showYearOverYear
                    ? yearOverYearChange
                    : monthOverMonthChange
                  ).toFixed(2)}
                  %
                </p>
                <button
                  onClick={toggleChangeMetric}
                  className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] bg-white/70 text-gray-700 rounded hover:bg-white/90 transition-colors"
                >
                  {showYearOverYear ? "MoM" : "YoY"}
                </button>
              </div>

              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Total Spent
                  </h2>
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {formatDollarAmount(totalSpent)}
                </p>
              </div>

              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Total Income
                  </h2>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {formatDollarAmount(totalIncome)}
                </p>
              </div>
            </div>

            {/* AI Insights Section */}
            <AIInsights 
              transactions={transactions}
              isPremium={isPremium}
              onShowUpsell={() => setShowUpsellDialog(true)}
            />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly Spending Trend */}
              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <h2 className="text-lg text-gray-100 font-semibold mb-4">
                  Monthly Spending Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(tick) => {
                        const [year, month] = tick.split("-");
                        const date = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          1
                        );
                        return date.toLocaleString("default", {
                          month: "short",
                          year: "2-digit",
                        });
                      }}
                      stroke="#9CA3AF"
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      formatter={(value) => formatDollarAmount(value as number)}
                      labelFormatter={(label) => {
                        const [year, month] = label.split("-");
                        const date = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          1
                        );
                        return date.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        });
                      }}
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: '8px', border: 'none', color: '#F3F4F6' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#287FAD" strokeWidth={2} dot={{ fill: '#287FAD', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Spending by Category */}
              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <h2 className="text-lg text-gray-100 font-semibold mb-4">
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
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          formatDollarAmount(value as number)
                        }
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: '8px', border: 'none', color: '#F3F4F6' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-700 bg-white/30 rounded-lg">
                    Category data not available in CSV
                  </div>
                )}
              </div>

              {/* Average Spending by Day of Week */}
              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <h2 className="text-lg text-gray-100 font-semibold mb-4">
                  Avg Spending by Day of Week
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgSpendingByDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      formatter={(value) => formatDollarAmount(value as number)}
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: '8px', border: 'none', color: '#F3F4F6' }}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#f2923d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Spending Trend */}
              <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
                <h2 className="text-lg text-gray-100 font-semibold mb-4">
                  Category Spending Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(tick) => {
                        const [year, month] = tick.split("-");
                        const date = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          1
                        );
                        return date.toLocaleString("default", {
                          month: "short",
                          year: "2-digit",
                        });
                      }}
                      stroke="#9CA3AF"
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      formatter={(value) => formatDollarAmount(value as number)}
                      labelFormatter={(label) => {
                        const [year, month] = label.split("-");
                        const date = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          1
                        );
                        return date.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        });
                      }}
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: '8px', border: 'none', color: '#F3F4F6' }}
                    />
                    <Legend />
                    {categoryBreakdown.map((category, index) => (
                      <Bar
                        key={category.name}
                        dataKey={category.name}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recurring Payments Table */}
            <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg text-gray-100 font-semibold">
                  Recurring Monthly Payments
                </h2>
                <RefreshCw className="w-6 h-6 text-[#287FAD]" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Months Charged
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800/30 divide-y divide-gray-700">
                    {recurringPayments.map((payment, index) => (
                      <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {payment.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100 font-medium">
                          {formatDollarAmount(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {payment.months}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Upsell Dialog - outside of conditional rendering */}
          <UpsellDialog 
            isOpen={showUpsellDialog}
            onClose={() => setShowUpsellDialog(false)}
          />
        </div>
      </div>
    </div>
  );
}
