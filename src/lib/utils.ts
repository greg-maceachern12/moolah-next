export const formatDollarAmount = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const detectCSVType = (headers: string[]): 'AMEX' | 'Chase' | 'Capital One' | 'Unknown' => {
  const headerSet = new Set(headers)

  if (headerSet.has('Date') && headerSet.has('Description') && headerSet.has('Amount')) {
    return 'AMEX'
  }

  if (headerSet.has('Transaction Date') && headerSet.has('Description') && headerSet.has('Amount') && headerSet.has('Category')) {
    return 'Chase'
  }

  if (headerSet.has('Account Number') && headerSet.has('Transaction Description') && headerSet.has('Transaction Date') && headerSet.has('Transaction Amount') && headerSet.has('Balance')) {
    return 'Capital One'
  }

  return 'Unknown'
}