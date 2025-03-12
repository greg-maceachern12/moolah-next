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
import Papa from "papaparse";
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
import EmptyState from "./EmptyState";
import UpsellDialog from "./UpsellDialog";
import AIInsights from "./AIInsights";
import { Transaction, CategoryTrendItem, RecurringPayment } from "@/lib/types";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
  "#ffc658",
];

interface CSVFieldMapping {
  dateField: string;
  descriptionField: string;
  amountField?: string;
  categoryField?: string;
  transactionTypeField?: string;
  debitField?: string;
  creditField?: string;
  hasDebitCreditPair: boolean;
  debitIndicator?: string;
}

export default function SpendingDashboard() {
  // State Management
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [processedTransactions, setProcessedTransactions] = useState<
    Transaction[]
  >([]);
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
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [hasCategoryData, setHasCategoryData] = useState(false);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [categoryTrendData, setCategoryTrendData] = useState<CategoryTrendItem[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);

  // Check premium status when component mounts and when it becomes visible again
  useEffect(() => {
    // Check if user has a premium subscription in localStorage
    const savedEmail = localStorage.getItem("polar_subscriber_email");
    if (savedEmail) {
      setIsPremium(true);
    }
    
    // Add event listener for visibility change to recheck premium status
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const savedEmail = localStorage.getItem("polar_subscriber_email");
        if (savedEmail) {
          setIsPremium(true);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const detectCSVFields = (headers: string[]): CSVFieldMapping | null => {
    const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));

    // Create a mapping of potential field names
    const dateFields = [
      "date",
      "transaction date",
      "posting date",
      "trans date",
      "transaction_date",
      "txn_date",
      "post_date",
      "posted date", 
      "statement date",
      "purchase date",
    ];
    const descriptionFields = [
      "description",
      "transaction description",
      "merchant",
      "payee",
      "details",
      "transaction_description",
      "desc",
      "name",
      "transaction",
      "memo",
      "notes",
      "reference",
      "vendor",
    ];
    const amountFields = [
      "amount",
      "transaction amount",
      "payment amount",
      "debit",
      "credit",
      "transaction_amount",
      "txn_amount",
      "payment",
      "withdrawals",
      "deposits",
      "debit amount",
      "credit amount",
      "deposit amount",
      "withdrawal amount",
      "charge amount",
    ];
    const categoryFields = [
      "category",
      "merchant category",
      "type",
      "category_name",
      "merchant_category",
      "transaction_category",
      "expense category",
      "spending category",
      "transaction type",
    ];
    const transactionTypeFields = [
      "transaction type",
      "type",
      "trans type",
      "transaction_type",
      "txn_type",
      "trans_type",
      "debit/credit",
      "entry type",
    ];
    
    // Special column pairs (sometimes amounts are split into debit/credit columns)
    const debitColumns = [
      "debit",
      "withdrawal",
      "withdrawals",
      "debit amount",
      "payment",
      "charge",
      "charges",
      "expense",
    ];
    
    const creditColumns = [
      "credit",
      "deposit",
      "deposits",
      "credit amount",
      "refund",
      "refunds",
      "inflow",
      "income",
    ];

    // Find matching fields
    const findField = (possibleFields: string[]): string | undefined => {
      return possibleFields.find((field) =>
        headerSet.has(field.toLowerCase().trim())
      );
    };

    const dateField = findField(dateFields);
    const descriptionField = findField(descriptionFields);
    let amountField = findField(amountFields);
    const categoryField = findField(categoryFields);
    const transactionTypeField = findField(transactionTypeFields);
    
    // Check for debit/credit column pairs
    const debitField = findField(debitColumns);
    const creditField = findField(creditColumns);
    
    let hasDebitCreditPair = false;
    if (!amountField && debitField && creditField) {
      // If we have both debit and credit columns but no single amount field
      amountField = debitField; // Default to using debit column
      hasDebitCreditPair = true;
    }

    if (!dateField || !descriptionField || (!amountField && !hasDebitCreditPair)) {
      return null; // Can't process without these essential fields
    }

    // Find the original case-sensitive header names
    const findOriginalHeader = (lowerCaseField: string): string => {
      return (
        headers.find((h) => h.toLowerCase().trim() === lowerCaseField) ||
        lowerCaseField
      );
    };

    return {
      dateField: findOriginalHeader(dateField),
      descriptionField: findOriginalHeader(descriptionField),
      amountField: amountField ? findOriginalHeader(amountField) : undefined,
      categoryField: categoryField
        ? findOriginalHeader(categoryField)
        : undefined,
      transactionTypeField: transactionTypeField
        ? findOriginalHeader(transactionTypeField)
        : undefined,
      debitField: debitField ? findOriginalHeader(debitField) : undefined,
      creditField: creditField ? findOriginalHeader(creditField) : undefined,
      hasDebitCreditPair,
      debitIndicator: "Debit", // Default value, commonly used
    };
  };

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

  interface CSVRow {
    [key: string]: string;
  }

  const processFiles = useCallback(
    async (files: File[]) => {
      // Helper function to parse dates in various formats
      const parseDate = (dateStr: string): Date => {
        // Try the default date parsing first
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
        
        // Try to extract and parse date parts
        // Common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
        
        // First, normalize separators
        const normalized = dateStr.replace(/[./\\-]/g, '/');
        const parts = normalized.split('/').map(p => p.trim());
        
        if (parts.length === 3) {
          // Try common formats
          const formats = [
            // MM/DD/YYYY (US format)
            `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`,
            // DD/MM/YYYY (UK/EU format)
            `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`,
            // YYYY/MM/DD (ISO-like)
            `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`,
          ];
          
          // Try each format
          for (const fmt of formats) {
            date = new Date(fmt);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
        }
        
        // Try to handle dates with time components
        if (dateStr.includes(' ') || dateStr.includes('T')) {
          // Split date and time
          const [datePart] = dateStr.split(/[ T]/);
          return parseDate(datePart); // Recursively try with just the date part
        }
        
        // Return invalid date if all parsing attempts failed
        return new Date(NaN);
      };

      const processCSVRow = (
        row: Record<string, string>,
        fieldMapping: CSVFieldMapping
      ): Transaction | null => {
        let date: Date, description: string, category: string, amount: number;

        try {
          // Extract values using the detected field mapping
          const dateStr = row[fieldMapping.dateField] || "";
          const descriptionStr = row[fieldMapping.descriptionField] || "";
          const categoryStr = fieldMapping.categoryField
            ? row[fieldMapping.categoryField] || ""
            : "";
          
          // Handle amount based on our field mapping
          let amountStr = "0";
          
          if (fieldMapping.hasDebitCreditPair && fieldMapping.debitField && fieldMapping.creditField) {
            // Handle debit/credit column pairs
            const debitValue = row[fieldMapping.debitField] || "0";
            const creditValue = row[fieldMapping.creditField] || "0";
            
            // Parse both values, removing currency characters
            const debitAmount = parseFloat(debitValue.replace(/[$,]/g, "")) || 0;
            const creditAmount = parseFloat(creditValue.replace(/[$,]/g, "")) || 0;
            
            // If we have a value in the debit column, it's negative (expense)
            // If we have a value in the credit column, it's positive (income)
            if (debitAmount > 0) {
              amountStr = `-${debitAmount}`;
            } else if (creditAmount > 0) {
              amountStr = `${creditAmount}`;
            }
          } else if (fieldMapping.amountField) {
            // Standard amount field
            amountStr = row[fieldMapping.amountField] || "0";
          }

          // Try to parse the date with multiple formats
          date = parseDate(dateStr);
          if (isNaN(date.getTime())) {
            console.warn(`Unable to parse date: ${dateStr}`);
            return null;
          }

          description = descriptionStr.trim();
          if (!description) {
            console.warn("Empty description found, skipping row");
            return null;
          }
          
          category = categoryStr.trim();

          // Handle amount parsing
          amountStr = amountStr.replace(/[$,\s]/g, ""); // Remove currency symbols, commas, and spaces
          amount = parseFloat(amountStr);

          // Handle debit/credit indicators if available
          if (
            fieldMapping.transactionTypeField &&
            row[fieldMapping.transactionTypeField]?.toLowerCase().includes(fieldMapping.debitIndicator?.toLowerCase() || "debit")
          ) {
            amount = -Math.abs(amount);
          } else if (
            fieldMapping.transactionTypeField && 
            (row[fieldMapping.transactionTypeField]?.toLowerCase().includes("credit") || 
             row[fieldMapping.transactionTypeField]?.toLowerCase().includes("deposit"))
          ) {
            amount = Math.abs(amount);
          } else {
            // If amount is positive but likely a debit (expense)
            // Some CSVs use negative for expenses, others use positive
            const descLower = description.toLowerCase();
            const isLikelyPayment =
              descLower.includes("payment") ||
              descLower.includes("deposit") ||
              descLower.includes("credit") ||
              descLower.includes("refund") ||
              descLower.includes("transfer from");

            // If no transaction type field is available, make a best guess
            // Common pattern: negative amounts are expenses, positive are income
            if (!fieldMapping.transactionTypeField && !fieldMapping.hasDebitCreditPair) {
              // If not explicitly a payment-like transaction, make it negative (expense)
              if (!isLikelyPayment && amount > 0) {
                amount = -amount;
              }
            }
          }

          if (isNaN(date.getTime()) || isNaN(amount)) {
            console.warn(`Invalid date or amount: date=${dateStr}, amount=${amountStr}`);
            return null;
          }

          return {
            date: date.toISOString().split("T")[0],
            description,
            category,
            amount,
          };
        } catch (error) {
          console.error("Error processing CSV row:", error, row);
          return null;
        }
      };

      if (files.length === 0) return;

      const allTransactions: Transaction[] = [];
      
      // Store parsing errors to show to the user
      const parsingErrors: string[] = [];

      try {
        for (const file of files) {
          try {
            const results = await new Promise<Papa.ParseResult<CSVRow>>(
              (resolve, reject) => {
                Papa.parse(file, {
                  complete: resolve,
                  header: true,
                  skipEmptyLines: true,
                  error: (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                  },
                });
              }
            );

            if (!Array.isArray(results.data) || results.data.length === 0) {
              parsingErrors.push(`File "${file.name}" appears to be empty or has no valid data rows.`);
              continue;
            }

            const headers = Object.keys(results.data[0]);
            const fieldMapping = detectCSVFields(headers);

            if (!fieldMapping) {
              parsingErrors.push(
                `Could not identify required fields in file "${file.name}". ` +
                `The file must contain at minimum a date field, description field, and either an amount field or both debit and credit fields. ` +
                `Found headers: ${headers.join(', ')}`
              );
              continue;
            }

            const fileTransactions: Transaction[] = [];
            const rowErrors: string[] = [];
            
            results.data.forEach((row, rowIndex) => {
              try {
                const transaction = processCSVRow(row, fieldMapping);
                if (transaction) {
                  fileTransactions.push(transaction);
                } else {
                  rowErrors.push(`Row ${rowIndex + 1}`);
                }
              } catch (error) {
                rowErrors.push(`Row ${rowIndex + 1}`);
                console.error(`Error processing row ${rowIndex + 1}:`, error);
              }
            });
            
            if (rowErrors.length > 0) {
              if (rowErrors.length <= 5) {
                parsingErrors.push(
                  `Could not process ${rowErrors.length} rows in file "${file.name}" (rows: ${rowErrors.join(', ')})`
                );
              } else {
                parsingErrors.push(
                  `Could not process ${rowErrors.length} rows in file "${file.name}" (first 5 rows: ${rowErrors.slice(0, 5).join(', ')}...)`
                );
              }
            }

            if (fileTransactions.length === 0) {
              parsingErrors.push(`Could not extract any valid transactions from file "${file.name}".`);
            } else {
              console.log(`Successfully processed ${fileTransactions.length} transactions from "${file.name}"`);
              allTransactions.push(...fileTransactions);
            }
          } catch (fileError) {
            parsingErrors.push(`Error processing file "${file.name}": ${(fileError as Error).message || 'Unknown error'}`);
          }
        }

        if (allTransactions.length === 0) {
          throw new Error(
            `Could not extract any valid transactions from the uploaded files. ` +
            `${parsingErrors.length > 0 ? `Errors: ${parsingErrors.join(' ')}` : ''}`
          );
        }

        setProcessedTransactions(allTransactions);
        processTransactions(allTransactions);
        setCsvUploaded(true);
        
        // If we have some warnings but still processed transactions, show them to the user
        if (parsingErrors.length > 0) {
          console.warn(`Processed with warnings: ${parsingErrors.join(' ')}`);
        }
      } catch (error) {
        console.error("Error processing files:", error);
        // Set default values for critical states
        setTotalSpent(0);
        setTotalIncome(0);
        setAvgMonthlySpend(0);
        setAvgDailySpend(0);
        setTopMerchant({ name: "Error processing data", amount: 0 });
        setCategoryBreakdown([{ name: "Error", value: 0 }]);
        setMonthlySpending([]);
        setRecurringPayments([]);
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error processing files";
        alert(`Error processing transaction files: ${errorMessage}`);
      }
    },
    [processTransactions]
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        setSelectedFileCount(files.length);
        processFiles(Array.from(files));
      }
    },
    [processFiles]
  );

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
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-100 via-orange-100 to-blue-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800 flex items-center">
              <Image
                  src="/assets/icon.png"
                  alt="Moolah Logo"
                  width={40}
                  height={40}
                  className="ml-2"
                />
                Moolah
              </h1>
            </div>
          </div>
          {selectedFileCount > 0 && (
            <div className="text-sm text-gray-600 flex items-center mt-2">
              <FileText className="w-4 h-4 mr-2 text-indigo-500" />
              <span>{selectedFileCount} file(s) selected</span>
            </div>
          )}
          {startDate && endDate && (
            <div className="text-sm text-gray-600 flex items-center mt-2">
              <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
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

        {csvUploaded ? (
          <div className="space-y-8 animate-fade-in">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-600">
                    Avg. Monthly Spend
                  </h2>
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {formatDollarAmount(avgMonthlySpend)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-600">
                    Avg. Daily Spend
                  </h2>
                  <Sun className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">
                  {formatDollarAmount(avgDailySpend)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-600">
                    Top Merchant
                  </h2>
                  <ShoppingBag className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-xl font-bold text-black-600">
                  {topMerchant.name}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatDollarAmount(topMerchant.amount)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-600">
                    Largest Transaction
                  </h2>
                  <DollarSign className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-xl font-bold text-black-600">
                  {largestExpense.description}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatDollarAmount(largestExpense.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(largestExpense.date).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md relative">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-600">
                    {showYearOverYear
                      ? "Year-over-Year Change"
                      : "Month-over-Month Change"}
                  </h2>
                  <ArrowUpDown className="w-6 h-6 text-indigo-500" />
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
                  className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  {showYearOverYear ? "MoM" : "YoY"}
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-600">
                    Total Spent
                  </h2>
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {formatDollarAmount(totalSpent)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-600">
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
              transactions={processedTransactions}
              isPremium={isPremium}
              onShowUpsell={() => setShowUpsellDialog(true)}
            />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly Spending Trend */}
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg text-gray-600 font-semibold mb-4">
                  Monthly Spending Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" />
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
                    />
                    <YAxis />
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
                    />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Spending by Category */}
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg text-gray-600 font-semibold mb-4">
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
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Category data not available in CSV
                  </div>
                )}
              </div>

              {/* Average Spending by Day of Week */}
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg text-gray-600 font-semibold mb-4">
                  Avg Spending by Day of Week
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgSpendingByDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatDollarAmount(value as number)}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Spending Trend */}
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg text-gray-600 font-semibold mb-4">
                  Category Spending Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
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
                    />
                    <YAxis />
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
            <div className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg text-gray-600 font-semibold">
                  Recurring Monthly Payments
                </h2>
                <RefreshCw className="w-6 h-6 text-gray-500" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Months Charged
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recurringPayments.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDollarAmount(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.months}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState onFileUpload={handleFileUpload} />
        )}
        
        {/* Upsell Dialog - outside of conditional rendering */}
        <UpsellDialog 
          isOpen={showUpsellDialog}
          onClose={() => setShowUpsellDialog(false)}
        />
      </div>
    </div>
  );
}
