'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const features = [
    "AI-powered spending insights and recommendations",
    "Unlimited transaction history and data export"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto p-4"
            onClick={onClose}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button positioned absolutely */}
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 text-white/70 hover:text-white bg-black/30 backdrop-blur-sm rounded-full p-1.5 z-10 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Image section */}
              <div className="relative w-full">
                {/* Background image that fades to black */}
                <div className="aspect-[16/9] relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-[url('/assets/bg.png')] bg-cover bg-center"
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-black"></div>
                </div>
              </div>
              
              {/* Content section - more compact */}
              <div className="bg-black py-4 px-5">
                {/* Header and features in a more compact layout */}
                <div className="flex items-start mb-3">
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-full p-1.5 mr-2 mt-0.5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-2">Premium Experience</h2>
                    <div className="space-y-1.5">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-1.5">
                          <div className="bg-[#f2923d]/20 rounded-full p-0.5 mt-0.5 flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#f2923d]" />
                          </div>
                          <p className="text-xs text-gray-300">{feature}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center mt-3 mb-1 gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3 text-[#287FAD]" />
                      <span>One-time purchase. Lifetime access.</span>
                    </div>
                  </div>
                </div>
                
                {/* Call to action - buttons side by side */}
                <div className="flex gap-3 mt-4">
                <button
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-lg text-gray-300 text-sm hover:bg-slate-700/50 transition-colors border border-slate-600"
                  >
                    Maybe later
                  </button>
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-[#f2923d] to-[#287FAD] text-center py-2 px-3 rounded-lg text-white text-sm font-medium hover:from-[#e07e2d] hover:to-[#1e6a91] transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    Get Lifetime Access <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  
                </div>
                
                <div className="text-center text-xs text-gray-500 mt-2">
                  Pay once, own forever.
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpsellDialog;