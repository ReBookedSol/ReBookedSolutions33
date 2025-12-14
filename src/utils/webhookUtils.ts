const WEBHOOK_URL = "https://hook.relay.app/api/v1/playbook/cmj5lqoya3rfa0om18j7jhhxn/trigger/EcrGxmUckpkITHTHtZB9mQ";

export const sendPurchaseWebhook = async (orderData: any) => {
  try {
    const webhookPayload = {
      eventType: "order_purchase",
      timestamp: new Date().toISOString(),
      data: {
        orderId: orderData.id,
        orderNumber: orderData.order_id,
        buyerId: orderData.buyer_id,
        buyerEmail: orderData.buyer_email,
        buyerFullName: orderData.buyer_full_name,
        buyerPhoneNumber: orderData.buyer_phone_number,
        sellerId: orderData.seller_id,
        sellerEmail: orderData.seller_email,
        sellerFullName: orderData.seller_full_name,
        sellerPhoneNumber: orderData.seller_phone_number,
        bookId: orderData.book_id,
        items: Array.isArray(orderData.items) ? orderData.items : [],
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
      },
    };

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });
  } catch (error) {
    console.error("Error sending purchase webhook:", error);
  }
};
