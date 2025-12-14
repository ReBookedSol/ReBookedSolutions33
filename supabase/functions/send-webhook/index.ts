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

async function handleContactMessage(
  supabaseClient: any,
  payload: any
) {
  try {
    const contactData = payload.new;
    
    const webhookData = {
      id: contactData.id,
      name: contactData.name,
      email: contactData.email,
      subject: contactData.subject,
      message: contactData.message,
      status: contactData.status,
      createdAt: contactData.created_at,
    };

    const success = await sendWebhook("contact_message", webhookData);
    if (success) {
      console.log(`Contact message webhook sent: ${contactData.id}`);
    }
  } catch (error) {
    console.error("Error handling contact message webhook:", error);
  }
}

async function handleReport(
  supabaseClient: any,
  payload: any
) {
  try {
    const reportData = payload.new;

    const webhookData = {
      id: reportData.id,
      reporterUserId: reportData.reporter_user_id,
      reportedUserId: reportData.reported_user_id,
      bookId: reportData.book_id,
      bookTitle: reportData.book_title,
      sellerName: reportData.seller_name,
      reason: reportData.reason,
      status: reportData.status,
      createdAt: reportData.created_at,
    };

    const success = await sendWebhook("report", webhookData);
    if (success) {
      console.log(`Report webhook sent: ${reportData.id}`);
    }
  } catch (error) {
    console.error("Error handling report webhook:", error);
  }
}

async function handleOrderPurchase(
  supabaseClient: any,
  payload: any
) {
  try {
    const orderData = payload.new;

    // Fetch book details for more complete information
    let bookDetails = null;
    if (orderData.book_id) {
      try {
        const { data: book } = await supabaseClient
          .from("books")
          .select("id, title, author, isbn, price, condition, category")
          .eq("id", orderData.book_id)
          .single();

        bookDetails = book;
      } catch (error) {
        console.warn("Could not fetch book details:", error);
      }
    }

    // Fetch buyer profile for additional details
    let buyerDetails = null;
    if (orderData.buyer_id) {
      try {
        const { data: buyer } = await supabaseClient
          .from("profiles")
          .select("id, name, email, phone_number, created_at")
          .eq("id", orderData.buyer_id)
          .single();

        buyerDetails = buyer;
      } catch (error) {
        console.warn("Could not fetch buyer details:", error);
      }
    }

    // Fetch seller profile for additional details
    let sellerDetails = null;
    if (orderData.seller_id) {
      try {
        const { data: seller } = await supabaseClient
          .from("profiles")
          .select("id, name, email, phone_number, created_at")
          .eq("id", orderData.seller_id)
          .single();

        sellerDetails = seller;
      } catch (error) {
        console.warn("Could not fetch seller details:", error);
      }
    }

    const items = Array.isArray(orderData.items) ? orderData.items : [];

    const webhookData = {
      orderId: orderData.id,
      orderNumber: orderData.order_id,
      buyerId: orderData.buyer_id,
      buyerEmail: orderData.buyer_email,
      buyerFullName: orderData.buyer_full_name,
      buyerPhoneNumber: orderData.buyer_phone_number,
      buyerDetails: buyerDetails ? {
        name: buyerDetails.name,
        email: buyerDetails.email,
        phoneNumber: buyerDetails.phone_number,
        createdAt: buyerDetails.created_at,
      } : null,
      sellerId: orderData.seller_id,
      sellerEmail: orderData.seller_email,
      sellerFullName: orderData.seller_full_name,
      sellerPhoneNumber: orderData.seller_phone_number,
      sellerDetails: sellerDetails ? {
        name: sellerDetails.name,
        email: sellerDetails.email,
        phoneNumber: sellerDetails.phone_number,
        createdAt: sellerDetails.created_at,
      } : null,
      bookId: orderData.book_id,
      bookDetails: bookDetails ? {
        id: bookDetails.id,
        title: bookDetails.title,
        author: bookDetails.author,
        isbn: bookDetails.isbn,
        price: bookDetails.price,
        condition: bookDetails.condition,
        category: bookDetails.category,
      } : null,
      items: items.map((item: any) => ({
        bookId: item.book_id,
        title: item.title,
        author: item.author,
        price: item.price,
        condition: item.condition,
      })),
      amount: orderData.amount,
      totalAmount: orderData.total_amount,
      paymentReference: orderData.payment_reference,
      paystackReference: orderData.paystack_reference,
      status: orderData.status,
      paymentStatus: orderData.payment_status,
      deliveryOption: orderData.delivery_option,
      deliveryType: orderData.delivery_type,
      pickupType: orderData.pickup_type,
      selectedCourier: orderData.selected_courier_slug,
      selectedServiceCode: orderData.selected_service_code,
      selectedServiceName: orderData.selected_service_name,
      selectedShippingCost: orderData.selected_shipping_cost,
      paidAt: orderData.paid_at,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
      commitDeadline: orderData.commit_deadline,
      metadata: orderData.metadata,
    };

    const success = await sendWebhook("order_purchase", webhookData);
    if (success) {
      console.log(`Purchase webhook sent: ${orderData.id}`);
    }
  } catch (error) {
    console.error("Error handling order webhook:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const table = payload.table;

    console.log(`Processing webhook for table: ${table}`);

    if (table === "contact_messages") {
      await handleContactMessage(supabaseClient, payload);
    } else if (table === "reports") {
      await handleReport(supabaseClient, payload);
    } else if (table === "orders") {
      await handleOrderPurchase(supabaseClient, payload);
    } else {
      console.log(`Unknown table: ${table}`);
    }

    return new Response(
      JSON.stringify({ success: true, table }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
