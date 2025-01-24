import { Metadata } from 'next'
import SpendingDashboard from '@/app/components/SpendingDashboard'

export const metadata: Metadata = {
  title: 'Moolah | Understand Your Spending',
  description: 'Analyze your financial data with ease',
}

export default function Home() {
  return (
    <main>
      <SpendingDashboard />
    </main>
  )
}