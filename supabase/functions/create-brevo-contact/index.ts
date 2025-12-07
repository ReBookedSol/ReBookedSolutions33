import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/error-utils.ts";

interface BrevoContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface BrevoContactResponse {
  ok: boolean;
  contactId?: string;
  created?: boolean;
  error?: string;
}

/**
 * Creates or updates a contact in Brevo (Sendinblue)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "BREVO_API_KEY not configured",
        } as BrevoContactResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const body: BrevoContactRequest = await req.json();

    if (!body.email) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Email is required",
        } as BrevoContactResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Prepare contact data for Brevo
    const contactData: any = {
      email: body.email,
      attributes: {},
    };

    // Add first name if provided
    if (body.firstName) {
      contactData.attributes.FIRSTNAME = body.firstName;
    }

    // Add last name if provided
    if (body.lastName) {
      contactData.attributes.LASTNAME = body.lastName;
    }

    // Add any additional attributes (phone, affiliate_code, etc.)
    const excludedFields = ["email", "firstName", "lastName"];
    for (const [key, value] of Object.entries(body)) {
      if (!excludedFields.includes(key) && value !== undefined && value !== null) {
        // Convert snake_case to UPPERCASE for Brevo attributes
        const attributeKey = key.toUpperCase().replace(/_/g, "");
        contactData.attributes[attributeKey] = value;
      }
    }

    // Call Brevo API
    const brevoResponse = await fetch(
      "https://api.brevo.com/v3/contacts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(contactData),
      }
    );

    const responseData = await brevoResponse.json();

    // Brevo returns 200 for success and 409 if contact already exists
    if (brevoResponse.status === 409) {
      // Contact already exists - update it
      const updateResponse = await fetch(
        `https://api.brevo.com/v3/contacts/${body.email}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
          body: JSON.stringify(contactData),
        }
      );

      if (!updateResponse.ok) {
        const updateError = await updateResponse.json();
        return new Response(
          JSON.stringify({
            ok: false,
            error: getErrorMessage(updateError),
          } as BrevoContactResponse),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: updateResponse.status,
          }
        );
      }

      // Get the contact ID from Brevo
      const contactResponse = await fetch(
        `https://api.brevo.com/v3/contacts/${body.email}`,
        {
          method: "GET",
          headers: {
            "api-key": apiKey,
          },
        }
      );

      let contactId: string | undefined;
      if (contactResponse.ok) {
        const contactInfo = await contactResponse.json();
        contactId = String(contactInfo.id);
      }

      return new Response(
        JSON.stringify({
          ok: true,
          contactId,
          created: false,
        } as BrevoContactResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (!brevoResponse.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: getErrorMessage(responseData),
        } as BrevoContactResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: brevoResponse.status,
        }
      );
    }

    // Successfully created contact
    const contactId = String(responseData.id);

    return new Response(
      JSON.stringify({
        ok: true,
        contactId,
        created: true,
      } as BrevoContactResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: errorMessage,
      } as BrevoContactResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
