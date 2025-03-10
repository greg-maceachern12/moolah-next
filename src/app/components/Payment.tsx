"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Sparkles, Lock } from "lucide-react";
import { Polar } from "@polar-sh/sdk";

interface PaymentProps {
  onValidationSuccess: (success: boolean) => void;
}

const Payment = ({ onValidationSuccess }: PaymentProps) => {
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

    // Check if user has active subscription
    checkEmailSubscription(savedEmail)
      .then(({ hasActiveSubscription }) => {
        if (hasActiveSubscription) {
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

  const checkEmailSubscription = async (email: string) => {
    try {
      const response = await polar.subscriptions.list({
        productId: "b5a08134-928a-4aa0-8644-fbbc4ea7dc5d"
      });
      
      const items = response.result?.items || [];
      const activeSubscription = items.find(sub => 
        ["active", "trialing"].includes(sub.status) &&
        sub.customer.email === email &&
        sub.productId === "b5a08134-928a-4aa0-8644-fbbc4ea7dc5d"
      );
      console.log(activeSubscription);
      
      return { hasActiveSubscription: !!activeSubscription };
    } catch (error) {
      console.error("Polar API error:", error);
      throw new Error("Failed to verify subscription");
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
      const { hasActiveSubscription } = await checkEmailSubscription(email);
      if (hasActiveSubscription) {
        activatePremium(email);
      } else {
        window.open("https://buy.polar.sh/polar_cl_a6XfVPZiw3LFRXUk2IEnHF5XsR00VO7Sj8gsN2YdgK6", "_blank");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Subscription check failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (view === "checking") {
    return (
      <div className="bg-gradient-to-br from-white to-gray-100 rounded-xl p-3 shadow-lg border border-indigo-100 flex items-center justify-center gap-2 transition-all duration-300 w-full max-w-5xl">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-gray-700">Verifying your premium status...</p>
      </div>
    );
  }

  if (view === "success") {
    return (
      <div className="bg-gradient-to-br from-white to-gray-100 rounded-xl p-3 shadow-lg border border-green-100 transition-all duration-300 w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 rounded-full p-1.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">Premium Activated</h3>
          </div>
          <p className="text-xs text-gray-600">Enjoy all premium features and priority support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 w-full">
      {/* Premium header - clean, light design */}
      <div className="bg-gray-50 border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 rounded-full p-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">Premium</h2>
          </div>
          
          <div className="flex items-center gap-x-2">
            <div className="flex items-center gap-1 text-gray-600 text-xs">
              <CheckCircle className="w-2.5 h-2.5 text-indigo-500" />
              <span>o3-mini</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 text-xs">
              <CheckCircle className="w-2.5 h-2.5 text-indigo-500" />
              <span>Unlimited Uploads</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 text-xs">
              <CheckCircle className="w-2.5 h-2.5 text-indigo-500" />
              <span>New features first</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email form section */}
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="text-xs font-medium text-gray-700 mb-1 block">
              Verify your premium email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-2 px-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors duration-200"
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
            <div className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-600 flex items-center gap-1.5 border border-red-100 mb-3">
              <XCircle className="w-3 h-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Lock className="w-2 h-2" />
            <p>Subscription details securely verified</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payment;