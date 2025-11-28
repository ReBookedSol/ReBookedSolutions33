import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bodyResult = await parseRequestBody<{
      order_id: string;
      reason?: string;
    }>(req, corsHeaders);
    if (!bodyResult.success) return bodyResult.errorResponse!;

    const { order_id, reason } = bodyResult.data!;

    // Get order details with all fields needed
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is authorized (admin, buyer, or seller)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthorized =
      profile?.role === 'admin' ||
      profile?.role === 'super_admin' ||
      order.buyer_id === user.id ||
      order.seller_id === user.id;

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authorized to cancel this order' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if order can be cancelled based on status
    const blockedStatuses = ['collected', 'in transit', 'out for delivery', 'delivered'];
    const orderStatus = (order.status || '').toLowerCase();
    const deliveryStatus = (order.delivery_status || '').toLowerCase();

    if (blockedStatuses.includes(orderStatus) || blockedStatuses.includes(deliveryStatus)) {
      const currentStatus = blockedStatuses.includes(orderStatus) ? order.status : order.delivery_status;
      return new Response(
        JSON.stringify({
          success: false,
          error: `Your order is "${currentStatus}". Therefore you cannot cancel the order. Contact support for more assistance.`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 1: Cancel shipment with BobGo
    let shipmentCancelled = false;
    let shipmentCancelError = null;

    if (order.tracking_number || order.id) {
      try {
        const cancelShipmentUrl = `${SUPABASE_URL}/functions/v1/bobgo-cancel-shipment`;

        const shipmentResponse = await fetch(cancelShipmentUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            tracking_number: order.tracking_number,
            order_id: order.id,
            reason: reason || 'Order cancelled by user',
          }),
        });

        const shipmentResult = await shipmentResponse.json();

        if (shipmentResponse.ok && shipmentResult.success) {
          shipmentCancelled = true;
        } else {
          shipmentCancelError = shipmentResult.error || 'Unknown error';
        }
      } catch (error: any) {
        shipmentCancelError = error.message;
      }
    }

    // STEP 2: Process refund with BobPay
    let refundProcessed = false;
    let refundId = null;
    let refundAmount = null;

    try {
      const refundUrl = `${SUPABASE_URL}/functions/v1/bobpay-refund`;

      const refundResponse = await fetch(refundUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          order_id: order_id,
          reason: reason || 'Order cancelled by user',
        }),
      });

      const refundResult = await refundResponse.json();

      if (refundResponse.ok && refundResult.success) {
        refundProcessed = true;
        refundId = refundResult.data?.refund_id;
        refundAmount = refundResult.data?.amount;
      } else {
        throw new Error(refundResult.error || 'Refund processing failed');
      }
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Refund failed: ${error.message}`,
          shipment_cancelled: shipmentCancelled,
          shipment_cancel_error: shipmentCancelError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 3: Update order status (should be done by refund function, but ensure it's done)
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        refund_status: 'completed',
        refunded_at: new Date().toISOString(),
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Order cancelled by user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    // STEP 4: Create notifications
    try {
      await supabase.from('order_notifications').insert([
        {
          order_id: order_id,
          user_id: order.buyer_id,
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: 'Your order has been cancelled and refunded successfully.',
        },
        {
          order_id: order_id,
          user_id: order.seller_id,
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: 'An order has been cancelled and refunded.',
        },
      ]);
    } catch (notifError) {
      // Notification error - don't fail the whole operation
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order cancelled and refund processed successfully',
        data: {
          order_id: order_id,
          tracking_number: order.tracking_number,
          shipment_cancelled: shipmentCancelled,
          shipment_cancel_error: shipmentCancelError,
          refund_processed: refundProcessed,
          refund_id: refundId,
          refund_amount: refundAmount,
          refund_status: 'completed',
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
