"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Sparkles, Lock } from "lucide-react";
import { Polar } from "@polar-sh/sdk";

interface PaymentProps {
  onValidationSuccess: (success: boolean) => void;
  onShowUpsell: () => void;
}

const Payment = ({ onValidationSuccess, onShowUpsell }: PaymentProps) => {
  const [view, setView] = useState<"checking" | "success" | "email">("checking");
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Polar client configuration
  const polar = new Polar({
    accessToken: process.env.NEXT_PUBLIC_POLAR_ACCESS_TOKEN || "",
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("polar_subscriber_email");
    if (!savedEmail) {
      setView("email");
      return;
    }

    // Check if user has active purchase
    checkEmailPurchase(savedEmail)
      .then(({ hasActivePurchase }) => {
        if (hasActivePurchase) {
          activatePremium(savedEmail);
        } else {
          setView("email");
        }
      })
      .catch(() => setView("email"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activatePremium = (email: string) => {
    localStorage.setItem("polar_subscriber_email", email);
    setView("success");
    onValidationSuccess(true);
  };

  const checkEmailPurchase = async (email: string) => {
    try {
      const response = await polar.orders.list({
        productId: "f44b493b-27f3-4c5f-a38c-a86f6885d19f"
      });
      console.log(response);
      const items = response.result?.items || [];
      const activePurchase = items.find(sub => 
        sub.customer.email === email &&
        sub.productId === "f44b493b-27f3-4c5f-a38c-a86f6885d19f"
      );
      console.log(activePurchase);
      
      return { hasActivePurchase: !!activePurchase };
    } catch (error) {
      console.error("Polar API error:", error);
      throw new Error("Failed to verify purchase");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { hasActivePurchase } = await checkEmailPurchase(email);
      if (hasActivePurchase) {
        activatePremium(email);
      } else {
        onShowUpsell();
        localStorage.setItem("polar_subscriber_email", email);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Purchase verification failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (view === "checking") {
    return (
      <div className="bg-gradient-to-br from-[#f2923d] to-[#287FAD] rounded-xl p-3 shadow-lg border border-[#f2923d]/30 flex items-center justify-center gap-2 transition-all duration-300 w-full max-w-5xl">
        <RefreshCw className="w-4 h-4 animate-spin text-white" />
        <p className="text-sm font-medium text-white">Verifying your premium status...</p>
      </div>
    );
  }

  if (view === "success") {
    return (
      <div className="bg-gradient-to-br from-[#f2923d] to-[#287FAD] rounded-xl p-3 shadow-lg border border-[#f2923d]/40 transition-all duration-300 w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/30 backdrop-blur-sm rounded-full p-1.5">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-white">Premium Activated</h3>
          </div>
          <p className="text-xs text-white/90">Enjoy all premium features for life</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-filter backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-slate-700/50 transition-all duration-300 w-full">
      {/* Premium header - gradient design */}
      <div className="bg-gradient-to-r from-[#f2923d] to-[#287FAD] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-white">Premium</h2>
          </div>
          
          <div className="flex items-center gap-x-2">
            <div className="flex items-center gap-1 text-white/90 text-xs bg-white/10 px-2 py-1 rounded-full">
              <CheckCircle className="w-2.5 h-2.5 text-white" />
              <span>o3-mini</span>
            </div>
            <div className="flex items-center gap-1 text-white/90 text-xs bg-white/10 px-2 py-1 rounded-full">
              <CheckCircle className="w-2.5 h-2.5 text-white" />
              <span>Unlimited Uploads</span>
            </div>
            <div className="flex items-center gap-1 text-white/90 text-xs bg-white/10 px-2 py-1 rounded-full">
              <CheckCircle className="w-2.5 h-2.5 text-white" />
              <span>New features first</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email form section */}
      <div className="p-6 bg-slate-800/90">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="text-xs font-medium text-gray-300 mb-1 block">
              Verify your premium email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-2 px-3 pr-12 bg-slate-700/80 border border-slate-600 rounded-lg text-gray-100 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f2923d] focus:border-transparent transition-all"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center bg-[#f2923d] hover:bg-[#e07e2d] rounded-lg text-white transition-colors duration-200"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <ArrowRight className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-2 py-1 text-xs rounded-lg bg-red-900/50 text-red-200 flex items-center gap-1.5 border border-red-700/50 mb-3">
              <XCircle className="w-3 h-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="w-2 h-2" />
            <p>Purchase details securely verified</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payment;