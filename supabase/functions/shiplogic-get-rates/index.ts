import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      throw new Error('SHIPLOGIC_API_KEY not configured');
    }

    const body = await req.json();
    console.log('Get rates request:', JSON.stringify(body, null, 2));

    const ratesRequest: Record<string, unknown> = {
      parcels: body.parcels,
    };

    if (body.collection_pickup_point_id) {
      ratesRequest.collection_pickup_point_id = body.collection_pickup_point_id;
      ratesRequest.collection_pickup_point_provider = body.collection_pickup_point_provider || 'tcg-locker';
    } else if (body.collection_address) {
      ratesRequest.collection_address = body.collection_address;
    }

    if (body.delivery_pickup_point_id) {
      ratesRequest.delivery_pickup_point_id = body.delivery_pickup_point_id;
      ratesRequest.delivery_pickup_point_provider = body.delivery_pickup_point_provider || 'tcg-locker';
    } else if (body.delivery_address) {
      ratesRequest.delivery_address = body.delivery_address;
    }

    if (body.declared_value) ratesRequest.declared_value = body.declared_value;
    if (body.collection_min_date) ratesRequest.collection_min_date = body.collection_min_date;
    if (body.delivery_min_date) ratesRequest.delivery_min_date = body.delivery_min_date;

    console.log('Sending to Shiplogic:', JSON.stringify(ratesRequest, null, 2));

    const response = await fetch('https://api.shiplogic.com/rates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratesRequest),
    });

    const data = await response.json();
    console.log('Shiplogic response status:', response.status);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-rates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
