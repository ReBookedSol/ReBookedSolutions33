import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrevoContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  updateIfExists?: boolean;
}

interface BrevoContactResponse {
  ok: boolean;
  contactId?: string;
  created?: boolean;
  error?: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function hashEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.substring(0, 2)}***@${domain}`;
}

function mapBrevoError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.message) return String(err.message);
    if (err.code === 'duplicate_parameter') return 'Contact already exists';
    if (err.code === 'invalid_parameter') return 'Invalid parameter provided';
  }
  return 'An error occurred while processing your request';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    const samplePayload = {
      email: "student@example.com",
      firstName: "Sam",
      lastName: "Student",
      phone: "+27123456789",
      updateIfExists: true
    };
    return new Response(
      JSON.stringify({ samplePayload }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  }

  try {
    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) {
      console.error("[create-contact] BREVO_API_KEY not configured");
      return new Response(
        JSON.stringify({ ok: false, error: "Server configuration error" } as BrevoContactResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let body: BrevoContactRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON body" } as BrevoContactResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!body.email || typeof body.email !== 'string') {
      return new Response(
        JSON.stringify({ ok: false, error: "Email is required" } as BrevoContactResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!isValidEmail(body.email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid email format" } as BrevoContactResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const hashedEmail = hashEmail(body.email);
    console.log(`[create-contact] Processing request for: ${hashedEmail}`);

    const attributes: Record<string, string> = {};
    
    if (body.firstName) {
      attributes.FIRSTNAME = body.firstName;
    }
    if (body.lastName) {
      attributes.LASTNAME = body.lastName;
    }
    if (body.phone) {
      attributes.SMS = body.phone;
    }

    const brevoPayload = {
      email: body.email,
      attributes,
      updateEnabled: body.updateIfExists ?? false,
    };

    console.log(`[create-contact] Calling Brevo API for: ${hashedEmail}`);

    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    const responseData = await brevoResponse.json();

    if (brevoResponse.status === 409) {
      console.log(`[create-contact] Contact exists: ${hashedEmail}`);

      if (body.updateIfExists) {
        const updateResponse = await fetch(
          `https://api.brevo.com/v3/contacts/${encodeURIComponent(body.email)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "api-key": apiKey,
            },
            body: JSON.stringify({ attributes }),
          }
        );

        if (!updateResponse.ok) {
          const updateError = await updateResponse.json();
          console.error(`[create-contact] Update failed: ${hashedEmail}`, updateError);
          return new Response(
            JSON.stringify({ ok: false, error: mapBrevoError(updateError) } as BrevoContactResponse),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: updateResponse.status >= 500 ? 502 : 400 }
          );
        }
      }

      const contactResponse = await fetch(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(body.email)}`,
        {
          method: "GET",
          headers: { "api-key": apiKey },
        }
      );

      let contactId: string | undefined;
      if (contactResponse.ok) {
        const contactInfo = await contactResponse.json();
        contactId = String(contactInfo.id);
      }

      console.log(`[create-contact] Success (existing): ${hashedEmail}, id: ${contactId}`);
      return new Response(
        JSON.stringify({ ok: true, contactId, created: false } as BrevoContactResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (!brevoResponse.ok) {
      console.error(`[create-contact] Brevo error: ${hashedEmail}`, responseData);
      const statusCode = brevoResponse.status >= 500 ? 502 : brevoResponse.status;
      return new Response(
        JSON.stringify({ ok: false, error: mapBrevoError(responseData) } as BrevoContactResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: statusCode }
      );
    }

    const contactId = String(responseData.id);
    console.log(`[create-contact] Success (created): ${hashedEmail}, id: ${contactId}`);

    return new Response(
      JSON.stringify({ ok: true, contactId, created: true } as BrevoContactResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[create-contact] Unexpected error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" } as BrevoContactResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
