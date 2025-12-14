import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Webhook URLs for different event types
const WEBHOOK_URLS = {
  order_purchase: "https://hook.relay.app/api/v1/playbook/cmj5u9bzr46790nm68squ0101/trigger/eCLqFOqSeT2yMUZc-1yTTA",
  contact_message: "https://hook.relay.app/api/v1/playbook/cmj5lqoya3rfa0om18j7jhhxn/trigger/EcrGxmUckpkITHTHtZB9mQ",
  report: "https://hook.relay.app/api/v1/playbook/cmj5lqoya3rfa0om18j7jhhxn/trigger/EcrGxmUckpkITHTHtZB9mQ",
};

async function sendWebhook(eventType: string, payload: any): Promise<boolean> {
  try {
    const webhookUrl = WEBHOOK_URLS[eventType as keyof typeof WEBHOOK_URLS];
    
    if (!webhookUrl) {
      console.warn(`No webhook URL configured for event type: ${eventType}`);
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error sending webhook for ${eventType}:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { eventType, ...payload } = requestBody;

    if (!eventType) {
      return new Response(
        JSON.stringify({ success: false, message: "eventType is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Forwarding webhook for event type: ${eventType}`);

    const success = await sendWebhook(eventType, payload);

    if (success) {
      return new Response(
        JSON.stringify({ success: true, message: "Webhook sent successfully" }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Failed to send webhook" }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Webhook relay error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process webhook" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
