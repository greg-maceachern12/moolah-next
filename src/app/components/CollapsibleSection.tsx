'use client'
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CollapsibleSectionProps } from '@/lib/types'


export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  color = "bg-slate-800",
  icon
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={`${color} bg-opacity-70 backdrop-filter backdrop-blur-sm rounded-xl transition shadow-md duration-300 ease-in-out border border-slate-700/50`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-100 rounded-xl hover:bg-slate-700/50 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-xl font-bold">{title}</span>
        </div>
        {isExpanded ? 
          <ChevronUp className="w-6 h-6 text-gray-300" /> : 
          <ChevronDown className="w-6 h-6 text-gray-300" />
        }
      </button>
      {isExpanded && <div className="p-4 pt-2">{children}</div>}
    </div>
  )
}
