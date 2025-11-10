import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("BOBGO_WEBHOOK_SECRET") || "";

async function verifySignature(rawBody: string, signatureHeader?: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true;
  if (!signatureHeader) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const hexSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hexSignature === signatureHeader;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  try {
    const rawText = await req.text();
    const sigHeader = req.headers.get("x-bobgo-signature") || req.headers.get("x-signature") || null;
    const verified = await verifySignature(rawText, sigHeader);
    if (!verified && WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: "Signature verification failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let event: any;
    try {
      event = JSON.parse(rawText);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventType = event?.event_type || event?.type || event?.event || "unknown";
    const payload = event?.data || event;

    try {
      await supabase.from("delivery_automation_log").insert({
        action: `bobgo_webhook_${eventType}`,
        status: "received",
        provider: "bobgo",
        response_data: event,
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.warn("Failed to log webhook:", logErr);
    }

    switch (eventType) {
      case "shipment.tracking_event.created":
      case "tracking.updated": {
        const tracking_number = payload?.tracking_reference || payload?.tracking_number || payload?.shipment?.tracking_number;
        const status = payload?.status || payload?.event_status;
        const location = payload?.location || payload?.current_location;
        if (tracking_number) {
          try {
            const { data: orders } = await supabase
              .from("orders")
              .select("id")
              .eq("tracking_number", tracking_number)
              .limit(1);
            if (orders && orders.length > 0) {
              await supabase
                .from("orders")
                .update({
                  delivery_status: status || "in_transit",
                  tracking_data: {
                    last_checked: new Date().toISOString(),
                    courier_status: status,
                    current_location: location,
                    last_event: payload,
                  },
                  updated_at: new Date().toISOString(),
                })
                .eq("id", orders[0].id);
            }
          } catch (err) {
            console.error("Failed to update order tracking:", err);
          }
        }
        break;
      }
      case "shipment.created":
      case "shipment.submitted": {
        const shipmentId = payload?.id || payload?.shipment_id;
        const tracking = payload?.tracking_number || payload?.tracking_reference;
        if (shipmentId && tracking) {
          try {
            await supabase
              .from("orders")
              .update({ tracking_number: tracking, delivery_status: "submitted", updated_at: new Date().toISOString() })
              .eq("delivery_data->>shipment_id", shipmentId);
          } catch (err) {
            console.error("Failed to update shipment info:", err);
          }
        }
        break;
      }
      case "shipment.delivered": {
        const tracking_number = payload?.tracking_reference || payload?.tracking_number;
        if (tracking_number) {
          try {
            const { data: updatedOrderRow, error: updatedOrderError } = await supabase
              .from("orders")
              .update({ status: "completed", delivery_status: "delivered", updated_at: new Date().toISOString() })
              .eq("tracking_number", tracking_number)
              .select("id, book_id, seller_id, buyer_id")
              .single();

            if (updatedOrderError) {
              throw updatedOrderError;
            }

            // Create notification for buyer to confirm receipt
            if (updatedOrderRow && updatedOrderRow.buyer_id) {
              try {
                await supabase.from("order_notifications").insert({
                  order_id: updatedOrderRow.id,
                  user_id: updatedOrderRow.buyer_id,
                  type: "delivery_confirmation_needed",
                  title: "Your Book Has Arrived!",
                  message: "Your book has been delivered. Please confirm receipt to complete the transaction.",
                  read: false,
                });
              } catch (notifErr) {
                console.warn("Failed to create delivery notification:", notifErr);
              }

              // Send email prompting buyer to confirm receipt
              try {
                const { data: buyerData, error: buyerErr } = await supabase
                  .from("users")
                  .select("email, full_name")
                  .eq("id", updatedOrderRow.buyer_id)
                  .limit(1)
                  .single();

                const buyerEmail = buyerData?.email;
                const buyerName = buyerData?.full_name || "Buyer";

                if (buyerEmail) {
                  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
                  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

                  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Your Book Has Arrived</title></head><body style="font-family:Arial, sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:25px;text-align:center;border-radius:8px;color:#fff;"><h1 style="margin:0;font-size:22px;">Your Book Has Arrived!</h1></div><div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;border:1px solid #ddd;"><p>Hello ${buyerName},</p><p>Your order has been marked as delivered. Please log into your account and confirm whether you received the order to complete the transaction.</p><p style="text-align:center;margin-top:18px;"><a href="https://rebookedsolutions.co.za/orders/${updatedOrderRow.id}" style="padding:12px 18px;background:#667eea;color:#fff;border-radius:6px;text-decoration:none;">Confirm Delivery</a></p><p style="font-size:13px;color:#666;">If you did not receive the order, please report it in the order page and our team will assist you.</p></div></body></html>`;

                  const text = `Your Book Has Arrived!\n\nHello ${buyerName},\n\nYour order has been marked as delivered. Please log into your account and confirm whether you received the order to complete the transaction.\n\nConfirm: https://rebookedsolutions.co.za/orders/${updatedOrderRow.id}`;

                  await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
                    },
                    body: JSON.stringify({
                      to: buyerEmail,
                      subject: "Your Book Has Arrived — Please Confirm",
                      html,
                      text,
                    }),
                  });
                }
              } catch (emailErr) {
                console.warn("Failed to send delivery confirmation email:", emailErr);
              }
            }

            try {
              const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
              const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
              if (updatedOrderRow) {
                await fetch(`${SUPABASE_URL}/functions/v1/process-affiliate-earning`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                  },
                  body: JSON.stringify({
                    book_id: updatedOrderRow.book_id || null,
                    order_id: updatedOrderRow.id,
                    seller_id: updatedOrderRow.seller_id,
                  })
                });
              }
            } catch (affErr) {
              console.warn('Affiliate earning call failed (non-blocking):', affErr);
            }
          } catch (err) {
            console.error("Failed to mark order as delivered:", err);
          }
        }
        break;
      }
      case "shipment.cancelled": {
        const tracking_number = payload?.tracking_reference || payload?.tracking_number;
        if (tracking_number) {
          try {
            await supabase
              .from("orders")
              .update({
                status: "cancelled",
                delivery_status: "cancelled",
                cancellation_reason: payload?.cancellation_reason || "Cancelled by courier",
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("tracking_number", tracking_number);
          } catch (err) {
            console.error("Failed to mark order as cancelled:", err);
          }
        }
        break;
      }
      default:
        console.log("Unhandled webhook event type:", eventType);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("bobgo-webhook error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Webhook handler error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
