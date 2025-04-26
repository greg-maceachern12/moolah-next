"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Sparkles, Lock } from "lucide-react";
import { Polar } from "@polar-sh/sdk";

interface PaymentProps {
  onValidationSuccess: (success: boolean) => void;
  onShowUpsell: () => void;
}

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
  buttonText: "text-white",
  buttonHoverBg: "bg-blue-700",
  secondaryButtonBg: "bg-gray-100",
  secondaryButtonHoverBg: "bg-gray-200",
  secondaryButtonText: "text-gray-700",
  errorText: "text-red-600",
  errorBgLight: "bg-red-50",
  errorBorder: "border-red-200",
  successText: "text-green-600",
  successBgLight: "bg-green-50",
  successBorder: "border-green-200",
  inputBg: "bg-white", // Specific for inputs if different from cardBg
};

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
        productId: "f44b493b-27f3-4c5f-a38c-a86f6885d19f" // Ensure this product ID is correct
      });
      // console.log(response);
      const items = response.result?.items || [];
      const activePurchase = items.find(sub => 
        sub.customer.email === email &&
        sub.productId === "f44b493b-27f3-4c5f-a38c-a86f6885d19f"
      );
      // console.log(activePurchase);
      
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
        // If purchase not found, show upsell AND save email for potential future checks
        onShowUpsell();
        localStorage.setItem("polar_subscriber_email", email);
        // Optionally reset view to 'email' or keep it as is depending on desired UX
        // setView("email"); 
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Purchase verification failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Restyled "Checking" state
  if (view === "checking") {
    return (
      <div className={`${colors.cardBg} rounded-lg p-4 shadow-sm border ${colors.border} flex items-center justify-center gap-2 w-full`}>
        <RefreshCw className={`w-4 h-4 animate-spin ${colors.textSecondary}`} />
        <p className={`text-sm font-medium ${colors.textSecondary}`}>Verifying premium status...</p>
      </div>
    );
  }

  // Restyled "Success" state
  if (view === "success") {
    return (
      <div className={`${colors.successBgLight} rounded-lg p-4 shadow-sm border ${colors.successBorder} w-full`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${colors.successText} bg-white/50 rounded-full p-1`}> {/* Simple white bg circle */}
              <CheckCircle className={`w-4 h-4 ${colors.successText}`} />
            </div>
            <h3 className={`text-base font-semibold ${colors.successText}`}>Premium Activated</h3>
          </div>
          <p className={`text-xs ${colors.successText} opacity-90`}>Enjoy all premium features</p>
        </div>
      </div>
    );
  }

  // Restyled "Email" input state
  return (
    <div className={`${colors.cardBg} rounded-lg overflow-hidden shadow-sm border ${colors.border} w-full`}>
      {/* Simplified Premium header */}
      <div className={`${colors.accentBgLight} p-4 border-b ${colors.border}`}> 
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${colors.iconColor} ${colors.accentBgLight} rounded-md p-1.5 border border-blue-200`}> {/* Updated icon bg */}
              <Sparkles className={`w-4 h-4 ${colors.iconColor}`} />
            </div>
            <h2 className={`text-base font-semibold ${colors.textPrimary}`}>Premium Features</h2>
          </div>
          
          {/* Simplified feature tags */}
          <div className="hidden sm:flex items-center gap-x-2">
            {['AI Insights', 'Unlimited Uploads', 'Early Access'].map((feature) => (
              <div key={feature} className={`flex items-center gap-1 ${colors.textSecondary} text-xs ${colors.secondaryButtonBg} px-2 py-1 rounded-full border ${colors.border}`}> 
                <CheckCircle className="w-2.5 h-2.5 text-green-500" /> {/* Using green check for clarity */}
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email form section */}
      <div className="p-5"> {/* Adjusted padding */}
        <form onSubmit={handleSubmit} className="space-y-3"> {/* Added space-y */}
          <div> {/* Removed mb-3, handled by form space-y */}
            <label htmlFor="email" className={`text-xs font-medium ${colors.textSecondary} mb-1 block`}>
              Verify purchase or get premium
            </label>
            <div className="relative flex items-center"> {/* Use flex for button alignment */}
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`flex-grow w-full py-2 px-3 ${colors.inputBg} border ${colors.border} rounded-l-md ${colors.textPrimary} text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm`} // Use rounded-l-md
                disabled={isProcessing}
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className={`px-3 py-2 ${colors.accentBg} hover:${colors.buttonHoverBg} rounded-r-md ${colors.buttonText} transition-colors duration-200 flex items-center justify-center shadow-sm`} // Use rounded-r-md
                style={{ height: '42px' }} // Match input height (approx based on py-2, text-sm)
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className={`px-3 py-2 text-xs rounded-md ${colors.errorBgLight} ${colors.errorText} flex items-center gap-1.5 border ${colors.errorBorder} shadow-sm`}> {/* Adjusted styling */}
              <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className={`flex items-center gap-1.5 text-xs ${colors.textSecondary}`}> 
            <Lock className="w-3 h-3" /> {/* Slightly larger icon */}
            <p>Purchase details securely verified via Polar.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payment;