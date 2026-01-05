/**
 * Send user registration data to the webhook via Supabase edge function
 * Password is intentionally excluded from the payload
 */

import { callEdgeFunction } from "@/utils/edgeFunctionClient";

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  affiliateCode?: string;
  [key: string]: string | undefined;
}

export const sendRegistrationWebhook = async (data: RegistrationData): Promise<void> => {
  try {
    // Build payload - explicitly exclude password and any sensitive fields
    const webhookPayload = {
      eventType: "user_registration",
      timestamp: new Date().toISOString(),
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        ...(data.affiliateCode && { affiliateCode: data.affiliateCode }),
      },
    };

    // Call the edge function which will forward to the actual webhook
    await callEdgeFunction("relay-webhook", {
      method: "POST",
      body: webhookPayload,
    });
  } catch (error) {
    // Log error but don't throw - webhook failure shouldn't block registration
    console.error("Error sending registration webhook:", error);
  }
};
