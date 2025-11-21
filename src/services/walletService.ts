import { supabase } from "@/integrations/supabase/client";

export interface WalletBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit" | "hold" | "release";
  amount: number;
  reason: string | null;
  reference_order_id: string | null;
  reference_payout_id: string | null;
  status: string;
  created_at: string;
}

export class WalletService {
  /**
   * Get wallet balance for current user
   */
  static async getWalletBalance(): Promise<WalletBalance> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      const { data, error } = await supabase
        .rpc("get_wallet_summary", { p_user_id: user.id });

      if (error) {
        console.warn("Error fetching wallet balance:", error);
        // Return default zero balances if wallet doesn't exist yet
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      if (!data || data.length === 0) {
        // No wallet exists yet, return zeros
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      const balance = data[0];
      return {
        available_balance: Math.floor(balance.available_balance / 100),
        pending_balance: Math.floor(balance.pending_balance / 100),
        total_earned: Math.floor(balance.total_earned / 100),
      };
    } catch (error) {
      console.error("Error in getWalletBalance:", error);
      // Return safe defaults on error
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
      };
    }
  }

  /**
   * Get wallet balance for a specific user (admin only)
   */
  static async getUserWalletBalance(userId: string): Promise<WalletBalance> {
    try {
      const { data, error } = await supabase
        .rpc("get_wallet_summary", { p_user_id: userId });

      if (error) {
        console.warn("Error fetching user wallet balance:", error);
        // Return default zero balances if wallet doesn't exist yet
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      if (!data || data.length === 0) {
        // No wallet exists yet, return zeros
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      const balance = data[0];
      return {
        available_balance: Math.floor(balance.available_balance / 100),
        pending_balance: Math.floor(balance.pending_balance / 100),
        total_earned: Math.floor(balance.total_earned / 100),
      };
    } catch (error) {
      console.error("Error in getUserWalletBalance:", error);
      // Return safe defaults on error
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
      };
    }
  }

  /**
   * Get wallet transaction history
   */
  static async getTransactionHistory(limit = 50, offset = 0): Promise<WalletTransaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching transaction history:", error);
        return [];
      }

      return (data || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: Math.floor(tx.amount / 100),
        reason: tx.reason,
        reference_order_id: tx.reference_order_id,
        reference_payout_id: tx.reference_payout_id,
        status: tx.status,
        created_at: tx.created_at,
      }));
    } catch (error) {
      console.error("Error in getTransactionHistory:", error);
      return [];
    }
  }

  /**
   * Credit wallet when book is received (called from OrderCompletionCard)
   */
  static async creditWalletOnCollection(
    orderId: string,
    sellerId: string,
    bookPriceInRands: number
  ): Promise<{ success: boolean; error?: string; creditAmount?: number }> {
    try {
      // Convert RANDS to cents for the database function
      const bookPriceInCents = Math.round(bookPriceInRands * 100);

      // Call the database function that credits wallet and creates transaction
      const { data, error } = await supabase.rpc("credit_wallet_on_collection", {
        p_seller_id: sellerId,
        p_order_id: orderId,
        p_book_price: bookPriceInCents,
      });

      if (error) {
        console.error("Error crediting wallet:", error);
        return {
          success: false,
          error: error.message || "Failed to credit wallet",
        };
      }

      // Calculate the credit amount (90% of book price in RANDS)
      const creditAmount = (bookPriceInRands * 90) / 100;

      // Get seller details for notification
      try {
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (!userError && users) {
          const seller = users.find(u => u.id === sellerId);
          const sellerEmail = seller?.email;
          const sellerName = seller?.user_metadata?.first_name || seller?.user_metadata?.name || "Seller";

          if (seller?.id && sellerEmail) {
            // Get updated wallet balance
            const { data: walletData } = await supabase
              .from("user_wallets")
              .select("available_balance")
              .eq("user_id", sellerId)
              .single();

            const newBalance = walletData?.available_balance ? walletData.available_balance / 100 : creditAmount;

            // Get order and book details for notification
            const { data: order } = await supabase
              .from("orders")
              .select("books(title)")
              .eq("id", orderId)
              .single();

            const bookTitle = (order?.books as any)?.title || "Your Book";

            // Create in-app notification for seller
            try {
              await supabase.from("notifications").insert({
                user_id: sellerId,
                type: "success",
                title: "💰 Payment Received!",
                message: `Credit of R${creditAmount.toFixed(2)} has been added to your wallet for "${bookTitle}". New balance: R${newBalance.toFixed(2)}`,
                order_id: orderId,
                action_required: false
              });
            } catch (notifErr) {
              console.error("Error creating notification:", notifErr);
            }

            // Send email notification
            try {
              await supabase.functions.invoke("send-email", {
                body: {
                  to: sellerEmail,
                  subject: '💰 Payment Received - Credit Added to Your Account - ReBooked Solutions',
                  html: generateSellerCreditEmailHTML({
                    sellerName,
                    bookTitle,
                    bookPrice: bookPriceInRands,
                    creditAmount,
                    orderId,
                    newBalance,
                  }),
                },
              });
              console.log("✅ Credit notification email sent");
            } catch (emailErr) {
              console.error("Error sending email:", emailErr);
            }
          }
        }
      } catch (error) {
        console.error("Error in notification/email process:", error);
        // Don't fail the whole operation if notifications fail
      }

      return {
        success: true,
        creditAmount,
      };
    } catch (error) {
      console.error("Error in creditWalletOnCollection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Format amount in ZAR
   */
  static formatZAR(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  }

  /**
   * Get transaction type display label
   */
  static getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      credit: "Credited",
      debit: "Debited",
      hold: "On Hold",
      release: "Released",
    };
    return labels[type] || type;
  }

  /**
   * Get transaction type color
   */
  static getTransactionTypeColor(type: string): string {
    const colors: Record<string, string> = {
      credit: "text-green-600",
      debit: "text-red-600",
      hold: "text-amber-600",
      release: "text-blue-600",
    };
    return colors[type] || "text-gray-600";
  }
}
