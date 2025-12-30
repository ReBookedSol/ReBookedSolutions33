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

    const url = new URL(req.url);
    const params = new URLSearchParams();
    
    const type = url.searchParams.get('type');
    if (type) params.set('type', type);

    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    if (lat && lng) {
      params.set('lat', lat);
      params.set('lng', lng);
      if (url.searchParams.get('order_closest') === 'true') {
        params.set('order_closest', 'true');
      }
    }

    const minLat = url.searchParams.get('min_lat');
    const maxLat = url.searchParams.get('max_lat');
    const minLng = url.searchParams.get('min_lng');
    const maxLng = url.searchParams.get('max_lng');
    if (minLat && maxLat && minLng && maxLng) {
      params.set('min_lat', minLat);
      params.set('max_lat', maxLat);
      params.set('min_lng', minLng);
      params.set('max_lng', maxLng);
    }

    const search = url.searchParams.get('search');
    if (search) params.set('search', search);

    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const queryString = params.toString();
    const apiUrl = `https://api.shiplogic.com/pickup-points${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching pickup points from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
    console.error('Error in get-pickup-points:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
