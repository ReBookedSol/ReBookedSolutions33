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
      throw new Error('SHIPLOGIC_API_KEY not configured');
    }

    const body = await req.json();
    console.log('Cancel shipment request:', JSON.stringify(body, null, 2));

    if (!body.tracking_reference) {
      return new Response(JSON.stringify({ error: 'tracking_reference is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.shiplogic.com/shipments/cancel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tracking_reference: body.tracking_reference }),
    });

    const data = await response.json();
    console.log('Shiplogic response status:', response.status);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update order status in database if order_id provided
    if (body.order_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          delivery_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.order_id);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
      } else {
        console.log('Order delivery status updated to cancelled for:', body.order_id);
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in cancel-shipment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
