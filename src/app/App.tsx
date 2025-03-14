"use client";

import React, { useState, useCallback } from 'react';
import SpendingDashboard from '@/app/components/SpendingDashboard';
import EmptyState from '@/app/components/EmptyState';
import { Transaction } from '@/lib/types';
import Papa from 'papaparse';

function App() {
  const [processedTransactions, setProcessedTransactions] = useState<Transaction[]>([]);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  
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
            const results = await new Promise<Papa.ParseResult<Record<string, string>>>(
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
        setCsvUploaded(true);
        setSelectedFileCount(files.length);
        
        // If we have some warnings but still processed transactions, show them to the user
        if (parsingErrors.length > 0) {
          console.warn(`Processed with warnings: ${parsingErrors.join(' ')}`);
        }
      } catch (error) {
        console.error("Error processing files:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error processing files";
        alert(`Error processing transaction files: ${errorMessage}`);
      }
    },
    []
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        processFiles(Array.from(files));
      }
    },
    [processFiles]
  );

  const handlePremiumActivation = (active: boolean) => {
    setIsPremium(active);
  };

  return (
    <div className="App">
      {!csvUploaded ? (
        <EmptyState 
          onFileUpload={handleFileUpload} 
          onPremiumActivation={handlePremiumActivation}
        />
      ) : (
        <SpendingDashboard 
          transactions={processedTransactions}
          fileCount={selectedFileCount}
          isPremium={isPremium}
        />
      )}
    </div>
  );
}

export default App;