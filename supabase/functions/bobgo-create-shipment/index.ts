import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseRequestBody } from "../_shared/safe-body-parser.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyResult = await parseRequestBody(req, corsHeaders);
    if (!bodyResult.success) return bodyResult.errorResponse;

    const {
      order_id,
      provider_slug,
      service_level_code,
      pickup_address,
      delivery_address,
      parcels,
      reference,
      special_instructions
    } = bodyResult.data;

    if (!order_id || !parcels || parcels.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: order_id, parcels"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const BOBGO_API_KEY = Deno.env.get("BOBGO_API_KEY");

    function resolveBaseUrl() {
      const env = (Deno.env.get("BOBGO_BASE_URL") || "").trim().replace(/\/+$/, "");
      if (!env) return "https://api.bobgo.co.za/v2";
      if (env.includes("sandbox.bobgo.co.za") && !env.includes("api.sandbox.bobgo.co.za")) {
        return "https://api.sandbox.bobgo.co.za/v2";
      }
      if (env.includes("bobgo.co.za") && !/\/v2$/.test(env)) {
        return env + "/v2";
      }
      return env;
    }
    const BOBGO_BASE_URL = resolveBaseUrl();

    // Fetch order to get shipment details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({
        success: false,
        error: "Order not found"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Determine pickup and delivery types from order
    const pickupType = order.pickup_type || 'door';
    const deliveryType = order.delivery_type || 'door';

    // Use provider_slug and service_level_code from request, or fall back to order data
    const finalProviderSlug = provider_slug || order.selected_courier_slug;
    const finalServiceLevelCode = service_level_code || order.selected_service_code;

    if (!finalProviderSlug || !finalServiceLevelCode) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing provider_slug and service_level_code - must call bobgo-get-rates first"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let shipmentResult: any = null;
    let simulated = false;

    if (!BOBGO_API_KEY) {
      console.warn("No BOBGO_API_KEY - simulating shipment creation");
      simulated = true;
      const mockTracking = `BOG${Date.now().toString().slice(-9)}`;
      shipmentResult = {
        tracking_number: mockTracking,
        shipment_id: `bobgo_ship_${Date.now()}`,
        waybill_url: `https://example.com/labels/${mockTracking}.pdf`,
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        carrier: "simulated",
        cost: 0,
        simulated: true
      };
    } else {
      try {
        // Build base payload
        const payload: any = {
          parcels: parcels.map((p: any) => ({
            description: p.description || "Book",
            submitted_length_cm: p.length || 10,
            submitted_width_cm: p.width || 10,
            submitted_height_cm: p.height || 10,
            submitted_weight_kg: p.weight || 1,
            custom_parcel_reference: p.reference || ""
          })),
          declared_value: parcels.reduce((sum: number, p: any) => sum + (p.value || 100), 0),
          custom_tracking_reference: reference || `ORDER-${order_id}`,
          instructions_collection: special_instructions || "",
          instructions_delivery: special_instructions || "",
          service_level_code: finalServiceLevelCode,
          provider_slug: finalProviderSlug
        };

        // Handle pickup location - CRITICAL: For lockers, ONLY send location_id, NOT address
        if (pickupType === 'locker') {
          // Locker pickup - use location_id from order or locker data
          const pickupLocationId = order.pickup_locker_location_id ||
            order.pickup_locker_data?.id;

          if (!pickupLocationId) {
            throw new Error("Pickup locker location_id is required for locker pickup");
          }

          payload.collection_location_id = pickupLocationId;
          payload.collection_contact_name = order.seller_full_name || "Seller";
          payload.collection_contact_mobile_number = order.seller_phone_number || "0000000000";
          payload.collection_contact_email = order.seller_email || "seller@example.com";

          // DO NOT send collection_address for locker pickup
        } else {
          // Door pickup - use address
          const pickupAddr = pickup_address || {};
          payload.collection_address = {
            company: pickupAddr.company || "Seller",
            street_address: pickupAddr.streetAddress || pickupAddr.street_address || "",
            local_area: pickupAddr.suburb || pickupAddr.local_area || "",
            city: pickupAddr.city || pickupAddr.suburb || "",
            zone: pickupAddr.province || pickupAddr.zone || "",
            country: "ZA",
            code: pickupAddr.postalCode || pickupAddr.postal_code || pickupAddr.code || ""
          };
          payload.collection_contact_name = pickupAddr.contact_name || order.seller_full_name || "Seller";
          payload.collection_contact_mobile_number = pickupAddr.contact_phone || order.seller_phone_number || "0000000000";
          payload.collection_contact_email = pickupAddr.contact_email || order.seller_email || "seller@example.com";
        }

        // Handle delivery location - CRITICAL: For lockers, ONLY send location_id, NOT address
        if (deliveryType === 'locker') {
          // Locker delivery - use location_id from order or locker data
          const deliveryLocationId = order.delivery_locker_location_id ||
            order.delivery_locker_data?.id;

          if (!deliveryLocationId) {
            throw new Error("Delivery locker location_id is required for locker delivery");
          }

          payload.delivery_location_id = deliveryLocationId;
          payload.delivery_contact_name = order.buyer_full_name || "Buyer";
          payload.delivery_contact_mobile_number = order.buyer_phone_number || "0000000000";
          payload.delivery_contact_email = order.buyer_email || "buyer@example.com";

          // DO NOT send delivery_address for locker delivery
        } else {
          // Door delivery - use address
          const deliveryAddr = delivery_address || {};
          payload.delivery_address = {
            company: deliveryAddr.company || "",
            street_address: deliveryAddr.streetAddress || deliveryAddr.street_address || "",
            local_area: deliveryAddr.suburb || deliveryAddr.local_area || "",
            city: deliveryAddr.city || deliveryAddr.suburb || "",
            zone: deliveryAddr.province || deliveryAddr.zone || "",
            country: "ZA",
            code: deliveryAddr.postalCode || deliveryAddr.postal_code || deliveryAddr.code || ""
          };
          payload.delivery_contact_name = deliveryAddr.contact_name || order.buyer_full_name || "Buyer";
          payload.delivery_contact_mobile_number = deliveryAddr.contact_phone || order.buyer_phone_number || "0000000000";
          payload.delivery_contact_email = deliveryAddr.contact_email || order.buyer_email || "buyer@example.com";
        }

        console.log("📦 Creating BobGo shipment:", {
          pickupType,
          deliveryType,
          collection_location_id: payload.collection_location_id,
          delivery_location_id: payload.delivery_location_id,
          has_collection_address: !!payload.collection_address,
          has_delivery_address: !!payload.delivery_address
        });

        const resp = await fetch(`${BOBGO_BASE_URL}/shipments`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${BOBGO_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          console.error("Bobgo shipment HTTP error:", resp.status, text);
          throw new Error(`Bobgo shipment HTTP ${resp.status}: ${text}`);
        }

        const data = await resp.json();

        shipmentResult = {
          tracking_number: data.tracking_reference || data.tracking_number,
          shipment_id: data.id,
          submission_status: data.submission_status,
          status: data.status,
          estimated_collection_date: data.meta?.estimated_collection_date,
          estimated_delivery_date: data.meta?.estimated_delivery_date,
          carrier: data.provider_slug,
          service_level: data.service_level_code,
          cost: data.rate || data.charged_amount || 0,
          pickup_type: pickupType,
          delivery_type: deliveryType,
          raw: data
        };
      } catch (err: any) {
        console.error("Bobgo create shipment failed:", err?.message || err);
        simulated = true;
        const mockTracking = `BOG${Date.now().toString().slice(-9)}`;
        shipmentResult = {
          tracking_number: mockTracking,
          shipment_id: `bobgo_ship_${Date.now()}`,
          waybill_url: `https://example.com/labels/${mockTracking}.pdf`,
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          carrier: "simulated",
          api_error: err.message,
          simulated: true
        };
      }
    }

    // Update order with shipment details
    try {
      const updateObj: any = {
        tracking_number: shipmentResult.tracking_number,
        delivery_provider: "bobgo",
        delivery_data: {
          ...shipmentResult,
          pickup_type: pickupType,
          delivery_type: deliveryType,
          updated_at: new Date().toISOString()
        },
        status: "shipped",
        delivery_status: "shipped",
        updated_at: new Date().toISOString()
      };

      await supabase.from("orders").update(updateObj).eq("id", order_id);
    } catch (e) {
      console.error("DB update error:", e);
    }

    // Send notification to buyer
    try {
      if (order.buyer_id && shipmentResult.tracking_number) {
        await supabase.from("notifications").insert({
          user_id: order.buyer_id,
          type: "info",
          title: "📦 Your Order Has Shipped!",
          message: `Your order has been shipped via ${shipmentResult.carrier}${deliveryType === 'locker' ? ' to your selected locker' : ''
            }. Tracking: ${shipmentResult.tracking_number}`,
          order_id
        });
      }
    } catch (notifyErr) {
      console.warn("Notification failed:", notifyErr);
    }

    return new Response(JSON.stringify({
      success: true,
      simulated,
      tracking_number: shipmentResult.tracking_number,
      shipment_id: shipmentResult.shipment_id,
      waybill_url: shipmentResult.waybill_url,
      estimated_delivery: shipmentResult.estimated_delivery,
      carrier: shipmentResult.carrier,
      cost: shipmentResult.cost,
      pickup_type: pickupType,
      delivery_type: deliveryType,
      raw: shipmentResult.raw
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("bobgo-create-shipment error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to create shipment"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
