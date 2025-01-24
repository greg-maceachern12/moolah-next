export interface Transaction {
    date: string
    description: string
    category: string
    amount: number
  }
  
  export interface CategoryTrendItem {
    date: string
    [category: string]: string | number
  }
  