import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppliedCoupon, Coupon, couponUtils } from "@/types/coupon";
import { X, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ENV } from "@/config/environment";
import { couponService } from "@/services/couponService";

interface CouponInputProps {
  subtotal: number;
  onCouponApply: (coupon: AppliedCoupon) => void;
  onCouponRemove: () => void;
  appliedCoupon?: AppliedCoupon | null;
  disabled?: boolean;
}

const CouponInput: React.FC<CouponInputProps> = ({
  subtotal,
  onCouponApply,
  onCouponRemove,
  appliedCoupon,
  disabled = false,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formattedCode = couponUtils.formatCode(couponCode);

      let result: Coupon & { discountAmount?: number } | null = null;
      let usedEdgeFunction = false;

      // Try edge function first
      if (ENV.VITE_SUPABASE_URL) {
        try {
          usedEdgeFunction = true;
          const url = `${ENV.VITE_SUPABASE_URL}/functions/v1/validate-coupon`;
          console.log("Calling coupon validation endpoint:", url);

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: formattedCode,
              subtotal: subtotal,
            }),
          });

          console.log("Edge function response status:", response.status);

          const data = await response.json();
          console.log("Edge function response data:", data);

          if (response.ok && data.isValid) {
            result = data.coupon;
            result.discountAmount = data.discountAmount;
          } else if (!response.ok) {
            throw new Error(data.error || "Edge function validation failed");
          }
        } catch (edgeErr) {
          console.warn(
            "Edge function failed, falling back to local validation:",
            edgeErr
          );
          usedEdgeFunction = false;
        }
      }

      // Fallback to local couponService if edge function fails
      if (!result) {
        console.log("Using local coupon service for validation");
        const validationResult = await couponService.validateCoupon(
          formattedCode,
          subtotal
        );

        if (!validationResult.isValid) {
          setError(validationResult.error || "Invalid coupon code");
          return;
        }

        result = validationResult.coupon!;
        result.discountAmount = validationResult.discountAmount;
      }

      const coupon: Coupon = result;

      // Validate coupon is usable
      if (!couponUtils.isUsable(coupon)) {
        setError("This coupon has expired or is no longer available");
        return;
      }

      // Check minimum order amount
      if (!couponUtils.meetsMinimumOrder(coupon, subtotal)) {
        const minAmount = coupon.min_order_amount || 0;
        setError(
          `Minimum order amount of R${minAmount.toFixed(2)} required for this coupon`
        );
        return;
      }

      // Calculate discount
      const discountAmount =
        result.discountAmount ||
        couponUtils.calculateDiscount(coupon, subtotal);
      const discountPercentage =
        coupon.discount_type === "percentage" ? coupon.discount_value : undefined;

      const appliedCoupon: AppliedCoupon = {
        code: coupon.code,
        discountAmount,
        discountPercentage,
        couponId: coupon.id,
      };

      onCouponApply(appliedCoupon);
      setCouponCode("");
      toast.success(
        `Coupon applied! You save R${discountAmount.toFixed(2)} (via ${usedEdgeFunction ? "server" : "local"} validation)`
      );
    } catch (err) {
      console.error("Error applying coupon:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Detailed error:", errorMsg);
      setError("Failed to apply coupon. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemove();
    setCouponCode("");
    setError(null);
    toast.success("Coupon removed");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && !appliedCoupon) {
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">
                  {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-700">
                  You save R{appliedCoupon.discountAmount.toFixed(2)}
                  {appliedCoupon.discountPercentage ? ` (${appliedCoupon.discountPercentage}%)` : ""}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              if (error) setError(null);
            }}
            onKeyPress={handleKeyPress}
            disabled={isLoading || disabled}
            className="uppercase"
          />
        </div>
        <Button
          onClick={handleApplyCoupon}
          disabled={isLoading || disabled || !couponCode.trim()}
          variant="outline"
          className="min-w-fit border-book-600 text-book-600 hover:bg-book-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="hidden sm:inline">Applying...</span>
            </>
          ) : (
            "Apply"
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CouponInput;
