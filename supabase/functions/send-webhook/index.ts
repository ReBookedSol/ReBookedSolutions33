import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_URL =
  "https://hook.relay.app/api/v1/playbook/cmj5lqoya3rfa0om18j7jhhxn/trigger/EcrGxmUckpkITHTHtZB9mQ";

async function sendWebhook(payload: any): Promise<boolean> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error sending webhook:`, error);
    return false;
  }
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    console.log(`Forwarding webhook to Relay:`, payload.eventType);

    const success = await sendWebhook(payload);

    if (success) {
      return new Response(
        JSON.stringify({ success: true, message: "Webhook sent to Relay" }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Failed to send webhook to Relay" }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Webhook proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process webhook" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
