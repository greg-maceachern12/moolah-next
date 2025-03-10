'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Check, ArrowRight } from 'lucide-react';

interface UpsellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl?: string;
}

const UpsellDialog: React.FC<UpsellDialogProps> = ({ 
  isOpen, 
  onClose, 
  checkoutUrl = "https://buy.polar.sh/polar_cl_a6XfVPZiw3LFRXUk2IEnHF5XsR00VO7Sj8gsN2YdgK6" 
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Close button positioned absolutely */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 bg-white/80 rounded-full p-1"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Features section - top */}
        <div className="bg-gray-50 border-b border-gray-100 p-4 relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-indigo-100 rounded-full p-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Premium Experience</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Take your financial analysis to the next level with premium features.
          </p>
          
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-1.5">
                <div className="bg-green-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="w-2 h-2 text-green-600" />
                </div>
                <p className="text-xs text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Call to action - bottom */}
        <div className="p-4">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800 mb-1 text-center">
              Ready to upgrade your experience?
            </h3>
            
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-indigo-600 text-center py-2.5 px-4 rounded-lg text-white font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Upgrade to Premium <ArrowRight className="w-4 h-4" />
            </a>
            
            <button
              onClick={onClose}
              className="block w-full py-2 px-4 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors"
            >
              Maybe later
            </button>
            
            <div className="text-center text-xs text-gray-500">
              Cancel anytime. No hidden fees.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpsellDialog;