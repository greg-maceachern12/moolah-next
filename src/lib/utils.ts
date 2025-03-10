export const formatDollarAmount = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const detectCSVType = (headers: string[]): 'AMEX' | 'Chase' | 'Capital One' | 'Bank Statement' | 'General' | 'Unknown' => {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()))

  // Check for AMEX format
  if (
    (headerSet.has('date') && headerSet.has('description') && headerSet.has('amount')) ||
    (headerSet.has('date') && headerSet.has('description') && headerSet.has('debit'))
  ) {
    return 'AMEX'
  }

  // Check for Chase format
  if (
    (headerSet.has('transaction date') && headerSet.has('description') && headerSet.has('amount')) ||
    (headerSet.has('transaction date') && headerSet.has('description') && headerSet.has('amount') && headerSet.has('category'))
  ) {
    return 'Chase'
  }

  // Check for Capital One format
  if (
    (headerSet.has('account number') && headerSet.has('transaction description') && headerSet.has('transaction date') && headerSet.has('transaction amount')) ||
    (headerSet.has('transaction date') && headerSet.has('transaction description') && headerSet.has('debit') && headerSet.has('credit'))
  ) {
    return 'Capital One'
  }

  // Check for general bank statement format
  if (
    (headerSet.has('posting date') && headerSet.has('description') && (headerSet.has('withdrawals') || headerSet.has('deposits'))) ||
    (headerSet.has('date') && headerSet.has('payee') && (headerSet.has('debit') || headerSet.has('credit')))
  ) {
    return 'Bank Statement'
  }

  // Check if we can at least process this as a general transaction format
  if (
    (headerSet.has('date') || headerSet.has('transaction date') || headerSet.has('posting date')) &&
    (headerSet.has('description') || headerSet.has('payee') || headerSet.has('merchant') || headerSet.has('transaction')) &&
    (headerSet.has('amount') || headerSet.has('debit') || headerSet.has('credit') || headerSet.has('transaction amount'))
  ) {
    return 'General'
  }

  return 'Unknown'
}