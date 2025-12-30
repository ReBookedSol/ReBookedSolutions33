import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('SHIPLOGIC_API_KEY');
    if (!apiKey) {
      console.error('SHIPLOGIC_API_KEY not configured');
      throw new Error('SHIPLOGIC_API_KEY not configured');
    }

    const body = await req.json();
    console.log('Incoming create shipment request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.parcels || !Array.isArray(body.parcels) || body.parcels.length === 0) {
      return new Response(JSON.stringify({ error: 'parcels array is required and must not be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.collection_contact) {
      return new Response(JSON.stringify({ error: 'collection_contact is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.delivery_contact) {
      return new Response(JSON.stringify({ error: 'delivery_contact is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.service_level_code && !body.service_level_id) {
      return new Response(JSON.stringify({ error: 'service_level_code or service_level_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const shipmentRequest: Record<string, unknown> = {
      parcels: body.parcels,
      collection_contact: body.collection_contact,
      delivery_contact: body.delivery_contact,
    };

    if (body.service_level_code) shipmentRequest.service_level_code = body.service_level_code;
    if (body.service_level_id) shipmentRequest.service_level_id = body.service_level_id;

    const isCollectionPickupPoint = !!body.collection_pickup_point_id;
    
    if (isCollectionPickupPoint) {
      shipmentRequest.collection_pickup_point_id = body.collection_pickup_point_id;
      shipmentRequest.collection_pickup_point_provider = body.collection_pickup_point_provider || 'tcg-locker';
    } else if (body.collection_address) {
      shipmentRequest.collection_address = body.collection_address;
    } else {
      return new Response(JSON.stringify({ error: 'Either collection_address or collection_pickup_point_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isDeliveryPickupPoint = !!body.delivery_pickup_point_id;
    
    if (isDeliveryPickupPoint) {
      shipmentRequest.delivery_pickup_point_id = body.delivery_pickup_point_id;
      shipmentRequest.delivery_pickup_point_provider = body.delivery_pickup_point_provider || 'tcg-locker';
    } else if (body.delivery_address) {
      shipmentRequest.delivery_address = body.delivery_address;
    } else {
      return new Response(JSON.stringify({ error: 'Either delivery_address or delivery_pickup_point_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optional fields
    if (body.declared_value !== undefined) shipmentRequest.declared_value = body.declared_value;
    if (body.collection_min_date) shipmentRequest.collection_min_date = body.collection_min_date;
    if (body.collection_after) shipmentRequest.collection_after = body.collection_after;
    if (body.collection_before) shipmentRequest.collection_before = body.collection_before;
    if (body.delivery_min_date) shipmentRequest.delivery_min_date = body.delivery_min_date;
    if (body.delivery_after) shipmentRequest.delivery_after = body.delivery_after;
    if (body.delivery_before) shipmentRequest.delivery_before = body.delivery_before;
    if (body.customer_reference) shipmentRequest.customer_reference = body.customer_reference;
    if (body.custom_tracking_reference && !isCollectionPickupPoint) {
      shipmentRequest.custom_tracking_reference = body.custom_tracking_reference;
    }
    if (body.special_instructions_collection) shipmentRequest.special_instructions_collection = body.special_instructions_collection;
    if (body.special_instructions_delivery) shipmentRequest.special_instructions_delivery = body.special_instructions_delivery;
    if (body.mute_notifications !== undefined) shipmentRequest.mute_notifications = body.mute_notifications;
    if (body.opt_in_rates && Array.isArray(body.opt_in_rates)) shipmentRequest.opt_in_rates = body.opt_in_rates;
    if (body.opt_in_time_based_rates && Array.isArray(body.opt_in_time_based_rates)) {
      shipmentRequest.opt_in_time_based_rates = body.opt_in_time_based_rates;
    }

    console.log('Sending to Shiplogic API:', JSON.stringify(shipmentRequest, null, 2));

    const response = await fetch('https://api.shiplogic.com/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentRequest),
    });

    const responseText = await response.text();
    console.log('Shiplogic API response status:', response.status);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Shiplogic response:', responseText);
      return new Response(JSON.stringify({ 
        error: responseText || 'Unknown error from Shiplogic API',
        status: response.status 
      }), {
        status: response.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      console.error('Shiplogic API error:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ 
        error: data,
        message: data?.message || data?.error || 'Shipment creation failed',
        status: response.status
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update order with shipment data if order_id provided
    if (body.order_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          tracking_number: data.tracking_reference,
          delivery_status: 'shipped',
          delivery_data: data,
          waybill_url: data.waybill_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.order_id);

      if (updateError) {
        console.error('Failed to update order with shipment data:', updateError);
      } else {
        console.log('Order updated with shipment data for:', body.order_id);
      }
    }

    console.log('Shipment created successfully:', JSON.stringify(data, null, 2));
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-shipment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
