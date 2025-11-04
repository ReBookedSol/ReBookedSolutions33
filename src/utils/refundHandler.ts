import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RefundRequest {
  order_id: string;
  reason?: string;
}

interface PaymentTransaction {
  id: string;
  order_id: string;
  payment_method: string;
  paystack_response: any;
  reference: string;
}

/**
 * Detect payment provider from order data
 */
export const detectPaymentProvider = async (
  orderId: string
): Promise<'bobpay' | 'paystack' | 'unknown'> => {
  try {
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('payment_method, paystack_response')
      .eq('order_id', orderId)
      .single();

    if (error || !transaction) {
      console.warn('Could not detect payment provider:', error);
      return 'unknown';
    }

    // Check payment_method field first
    if (transaction.payment_method === 'bobpay') {
      return 'bobpay';
    }

    // Check response for provider indicator
    if (transaction.paystack_response?.provider === 'bobpay') {
      return 'bobpay';
    }

    // Default to paystack if method is not explicitly bobpay
    if (transaction.payment_method === 'paystack' || !transaction.payment_method) {
      return 'paystack';
    }

    return 'unknown';
  } catch (err) {
    console.error('Error detecting payment provider:', err);
    return 'unknown';
  }
};

/**
 * Handle refund intelligently based on payment provider
 */
export const handleIntelligentRefund = async (
  refundRequest: RefundRequest
): Promise<{ success: boolean; message: string }> => {
  try {
    const { order_id, reason } = refundRequest;

    // Detect payment provider
    const provider = await detectPaymentProvider(order_id);
    console.log('Detected payment provider:', provider);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    if (provider === 'bobpay') {
      // Use BobPay refund
      const { data, error } = await supabase.functions.invoke('bobpay-refund', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          order_id,
          reason: reason || 'Refund requested',
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'BobPay refund failed');
      }

      return {
        success: true,
        message: `Refund processed successfully: ${data.data?.message || 'Refund in progress'}`,
      };
    } else if (provider === 'paystack') {
      // Use Paystack refund (existing refund-management function)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('payment_reference')
        .eq('id', order_id)
        .single();

      if (orderError || !orderData?.payment_reference) {
        throw new Error('Payment reference not found');
      }

      const { data, error } = await supabase.functions.invoke('refund-management', {
        body: {
          payment_reference: orderData.payment_reference,
          reason: reason || 'Refund requested',
          order_id,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Paystack refund failed');
      }

      return {
        success: true,
        message: 'Refund processed successfully',
      };
    } else {
      throw new Error('Unable to determine payment provider for refund');
    }
  } catch (err) {
    console.error('Refund handling error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Refund failed';
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Refund order for buyers (non-committed orders)
 */
export const refundOrderForBuyer = async (
  orderId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  return handleIntelligentRefund({
    order_id: orderId,
    reason: reason || 'Cancelled by Buyer',
  });
};

/**
 * Refund order for sellers (decline commit)
 */
export const refundOrderForDecline = async (
  orderId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  return handleIntelligentRefund({
    order_id: orderId,
    reason: reason || 'Seller declined to commit',
  });
};
