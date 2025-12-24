import { supabase } from "@/integrations/supabase/client";
import { Coupon, CouponValidationResult, couponUtils } from "@/types/coupon";

export const couponService = {
  /**
   * Validate a coupon code and check if it's applicable to the order
   */
  validateCoupon: async (
    code: string,
    subtotal: number
  ): Promise<CouponValidationResult> => {
    try {
      const formattedCode = couponUtils.formatCode(code);

      // Fetch coupon from database
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", formattedCode)
        .single();

      if (error || !coupon) {
        return {
          isValid: false,
          discountAmount: 0,
          error: "Coupon code not found",
        };
      }

      // Check if coupon is active
      if (!coupon.is_active) {
        return {
          isValid: false,
          discountAmount: 0,
          error: "This coupon is no longer active",
        };
      }

      // Check if coupon has expired
      if (!couponUtils.isValidDate(coupon)) {
        return {
          isValid: false,
          discountAmount: 0,
          error: "This coupon has expired",
        };
      }

      // Check if coupon has usage limit and has been used up
      if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
        return {
          isValid: false,
          discountAmount: 0,
          error: "This coupon has reached its usage limit",
        };
      }

      // Check minimum order amount
      if (
        coupon.min_order_amount &&
        subtotal < coupon.min_order_amount
      ) {
        return {
          isValid: false,
          discountAmount: 0,
          error: `Minimum order amount of R${coupon.min_order_amount.toFixed(
            2
          )} required`,
        };
      }

      // Calculate discount amount
      const discountAmount = couponUtils.calculateDiscount(coupon, subtotal);

      return {
        isValid: true,
        coupon,
        discountAmount,
      };
    } catch (error) {
      console.error("Error validating coupon:", error);
      return {
        isValid: false,
        discountAmount: 0,
        error: "Failed to validate coupon",
      };
    }
  },

  /**
   * Redeem a coupon by incrementing usage count
   */
  redeemCoupon: async (couponId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ usage_count: (await getCouponUsageCount(couponId)) + 1 })
        .eq("id", couponId);

      if (error) {
        console.error("Error redeeming coupon:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      return false;
    }
  },

  /**
   * Create a new coupon (admin only)
   */
  createCoupon: async (couponData: Partial<Coupon>): Promise<Coupon | null> => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .insert([
          {
            code: couponUtils.formatCode(couponData.code || ""),
            discount_type: couponData.discount_type,
            discount_value: couponData.discount_value,
            description: couponData.description,
            max_uses: couponData.max_uses,
            min_order_amount: couponData.min_order_amount,
            max_discount_amount: couponData.max_discount_amount,
            valid_from: couponData.valid_from,
            valid_until: couponData.valid_until,
            is_active: couponData.is_active ?? true,
            usage_count: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating coupon:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating coupon:", error);
      return null;
    }
  },

  /**
   * Update an existing coupon (admin only)
   */
  updateCoupon: async (
    couponId: string,
    couponData: Partial<Coupon>
  ): Promise<Coupon | null> => {
    try {
      const updateData: any = {};

      if (couponData.discount_value !== undefined)
        updateData.discount_value = couponData.discount_value;
      if (couponData.description !== undefined)
        updateData.description = couponData.description;
      if (couponData.max_uses !== undefined)
        updateData.max_uses = couponData.max_uses;
      if (couponData.min_order_amount !== undefined)
        updateData.min_order_amount = couponData.min_order_amount;
      if (couponData.max_discount_amount !== undefined)
        updateData.max_discount_amount = couponData.max_discount_amount;
      if (couponData.valid_until !== undefined)
        updateData.valid_until = couponData.valid_until;
      if (couponData.is_active !== undefined)
        updateData.is_active = couponData.is_active;

      const { data, error } = await supabase
        .from("coupons")
        .update(updateData)
        .eq("id", couponId)
        .select()
        .single();

      if (error) {
        console.error("Error updating coupon:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating coupon:", error);
      return null;
    }
  },

  /**
   * Delete a coupon (admin only)
   */
  deleteCoupon: async (couponId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", couponId);

      if (error) {
        console.error("Error deleting coupon:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting coupon:", error);
      return false;
    }
  },

  /**
   * Get all coupons (admin only)
   */
  getAllCoupons: async (): Promise<Coupon[]> => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching coupons:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching coupons:", error);
      return [];
    }
  },

  /**
   * Get coupon by ID
   */
  getCouponById: async (couponId: string): Promise<Coupon | null> => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", couponId)
        .single();

      if (error) {
        console.error("Error fetching coupon:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching coupon:", error);
      return null;
    }
  },
};

/**
 * Helper function to get current usage count
 */
const getCouponUsageCount = async (couponId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("usage_count")
      .eq("id", couponId)
      .single();

    if (error || !data) return 0;
    return data.usage_count || 0;
  } catch {
    return 0;
  }
};
