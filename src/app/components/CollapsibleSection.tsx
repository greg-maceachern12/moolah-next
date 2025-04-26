'use client'
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CollapsibleSectionProps } from '@/lib/types'

// OpenAI-inspired colors (consistent with other components)
const colors = {
  background: "bg-gray-50",
  textPrimary: "text-gray-900",
  textSecondary: "text-gray-600",
  accent: "text-blue-600",
  accentBg: "bg-blue-600",
  accentBgLight: "bg-blue-100",
  border: "border-gray-200",
  cardBg: "bg-white",
  iconColor: "text-blue-600", 
  iconColorSecondary: "text-gray-500",
  secondaryButtonBg: "bg-gray-100",
  secondaryButtonHoverBg: "bg-gray-200",
};


export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  // color prop is removed, using consistent card background
  icon
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    // Use card background, border, and shadow from the theme
    <div className={`${colors.cardBg} rounded-lg transition shadow-sm duration-300 ease-in-out border ${colors.border}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        // Use theme text colors and hover background
        className={`w-full flex justify-between items-center p-4 text-left font-medium ${colors.textPrimary} rounded-t-lg hover:${colors.secondaryButtonHoverBg} transition-colors duration-200`}
        aria-expanded={isExpanded ? 'true' : 'false'}
      >
        <div className="flex items-center space-x-2.5"> {/* Adjusted spacing */}
          {icon} {/* Icon should be passed with theme color already applied */}
          <span className="text-base font-medium">{title}</span> {/* Adjusted text size/weight */}
        </div>
        {isExpanded ? 
          <ChevronUp className={`w-5 h-5 ${colors.iconColorSecondary}`} /> : // Use theme secondary icon color
          <ChevronDown className={`w-5 h-5 ${colors.iconColorSecondary}`} />
        }
      </button>
      {/* Content area - padding adjusted, border added if expanded */}
      {isExpanded && (
        <div className={`p-4 pt-3 border-t ${colors.border}`}> {/* Reduced top padding slightly, add border-t */}
          {children} 
        </div>
      )}
    </div>
  )
}
