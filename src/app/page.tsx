import { Metadata } from 'next'
import App from '@/app/App'

export const metadata: Metadata = {
  title: 'Moolah | Understand Your Spending',
  description: 'Analyze your financial data with ease',
}

export default function Home() {
  return (
    <main>
      <App />
    </main>
  )
}