export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  description: string;
  max_uses: number | null;
  usage_count: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  error?: string;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  discountPercentage?: number;
  couponId: string;
}

export const couponUtils = {
  calculateDiscount: (coupon: Coupon, subtotal: number): number => {
    if (coupon.discount_type === 'percentage') {
      const discount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount) {
        return Math.min(discount, coupon.max_discount_amount);
      }
      return discount;
    } else {
      // Fixed amount
      return coupon.discount_value;
    }
  },

  isValidDate: (coupon: Coupon): boolean => {
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);
    return now >= validFrom && now <= validUntil;
  },

  isUsable: (coupon: Coupon): boolean => {
    if (!coupon.is_active) return false;
    if (!couponUtils.isValidDate(coupon)) return false;
    if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) return false;
    return true;
  },

  meetsMinimumOrder: (coupon: Coupon, subtotal: number): boolean => {
    if (!coupon.min_order_amount) return true;
    return subtotal >= coupon.min_order_amount;
  },

  formatCode: (code: string): string => code.toUpperCase().trim(),
};
