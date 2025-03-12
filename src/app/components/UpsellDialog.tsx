'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Check, ArrowRight, Clock } from 'lucide-react';

interface UpsellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl?: string;
}

const UpsellDialog: React.FC<UpsellDialogProps> = ({ 
  isOpen, 
  onClose, 
  checkoutUrl = "https://buy.polar.sh/polar_cl_GV29UaSHnZ5REFaXNyIsH5dLTvpcV3ysUS7D529c4Le" 
}) => {
  if (!isOpen) return null;

  const features = [
    "AI-powered spending insights and recommendations",
    "Personalized monthly budget suggestions",
    "Trend forecasting for future expenses",
    "Unlimited transaction history",
    "Export data in multiple formats"
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-emerald-100"
      >
        {/* Close button positioned absolutely */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-white/70 hover:text-white bg-black/20 backdrop-blur-sm rounded-full p-1 z-10"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Header section with gradient background */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Premium Experience</h2>
          </div>
          
          <p className="text-sm text-white/90 mb-5">
            Take your financial analysis to the next level with premium features.
          </p>
        </div>
        
        {/* Features section */}
        <div className="p-6 bg-white">
          <div className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="bg-emerald-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
          
          {/* Call to action */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-700 py-2 px-4 bg-emerald-50 rounded-lg">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-semibold">
                One-time purchase. Lifetime access.
              </h3>
            </div>
            
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-center py-3 px-4 rounded-lg text-white font-medium hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              Get Lifetime Access <ArrowRight className="w-4 h-4" />
            </a>
            
            <button
              onClick={onClose}
              className="block w-full py-2.5 px-4 rounded-lg text-gray-600 text-sm hover:bg-gray-100 transition-colors border border-gray-200"
            >
              Maybe later
            </button>
            
            <div className="text-center text-xs text-gray-500">
              Pay once, own forever. No recurring fees.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpsellDialog;