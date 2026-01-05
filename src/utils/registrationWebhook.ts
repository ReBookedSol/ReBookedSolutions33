/**
 * Send user registration data to the webhook
 * Password is intentionally excluded from the payload
 */

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  affiliateCode?: string;
  [key: string]: string | undefined;
}

const WEBHOOK_URL = "https://hook.relay.app/api/v1/playbook/cmk0rzazy547x0om044t7g5px/trigger/lPLbxdN2Qz1-Hog1RF-CRA";

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

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      console.error(`Webhook request failed with status ${response.status}`);
    }
  } catch (error) {
    // Log error but don't throw - webhook failure shouldn't block registration
    console.error("Error sending registration webhook:", error);
  }
};
