import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OrderConfirmation } from "@/types/checkout";
import Step4Confirmation from "@/components/checkout/Step4Confirmation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedPurchaseEmailService } from "@/services/enhancedPurchaseEmailService";
import { NotificationService } from "@/services/notificationService";

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reference = searchParams.get("reference");

  useEffect(() => {
    if (!reference) {
      setError("No order reference provided");
      setLoading(false);
      return;
    }

    fetchOrderData();
  }, [reference]);

  /**
   * Handle post-payment actions: mark book as sold, send emails, create notifications
   * This acts as a fallback in case the webhook didn't fire or failed
   */
  const handlePostPaymentActions = async (order: any) => {
    try {
      console.log("🔄 Processing post-payment actions for order:", order.id);

      const bookItem = order.items?.[0];
      const bookId = bookItem?.book_id || order.book_id;

      console.log("📚 Book ID extracted:", {
        fromItems: bookItem?.book_id,
        fromOrder: order.book_id,
        final: bookId
      });

      // Step 1: Mark book as sold (idempotent operation)
      if (bookId) {
        try {
          console.log("🔍 Checking if book needs to be marked as sold:", bookId);

          const { data: bookData, error: bookFetchError } = await supabase
            .from("books")
            .select("id, title, available_quantity, sold_quantity, sold, availability")
            .eq("id", bookId)
            .single();

          if (bookFetchError) {
            console.warn("⚠️ Failed to fetch book data:", bookFetchError);
            return;
          }

          if (!bookData) {
            console.warn("⚠️ Book not found:", bookId);
            return;
          }

          console.log("📖 Book current state:", {
            id: bookData.id,
            title: bookData.title,
            sold: bookData.sold,
            availability: bookData.availability,
            available_quantity: bookData.available_quantity,
            sold_quantity: bookData.sold_quantity
          });

          // Only mark as sold if not already sold
          if (!bookData.sold) {
            console.log("🔄 Marking book as sold...");

            const { error: bookUpdateError } = await supabase
              .from("books")
              .update({
                sold: true,
                availability: "sold",
                sold_at: new Date().toISOString(),
                sold_quantity: (bookData.sold_quantity || 0) + 1,
                available_quantity: Math.max(0, (bookData.available_quantity || 0) - 1),
              })
              .eq("id", bookId);

            if (bookUpdateError) {
              console.error("❌ Failed to mark book as sold:", bookUpdateError);
              throw bookUpdateError;
            }

            console.log("✅ Book marked as sold successfully:", bookId);
          } else {
            console.log("ℹ️ Book already marked as sold:", bookId);
          }
        } catch (bookError) {
          console.error("❌ Book update error:", bookError);
          // Continue with other actions even if book marking fails
        }
      } else {
        console.warn("⚠️ No book ID found in order");
      }

      // Step 2: Send emails via EnhancedPurchaseEmailService
      const buyerName = order.buyer_full_name || "Buyer";
      const sellerName = order.seller_full_name || "Seller";
      const bookTitle = bookItem?.book_title || "Book";
      const bookPrice = bookItem?.price ? bookItem.price / 100 : 0;
      const orderTotal = order.amount ? order.amount / 100 : 0;

      try {
        await EnhancedPurchaseEmailService.sendPurchaseEmailsWithFallback({
          orderId: order.id,
          bookId: bookId || "",
          bookTitle,
          bookPrice,
          sellerName,
          sellerEmail: order.seller_email || "",
          buyerName,
          buyerEmail: order.buyer_email || "",
          orderTotal,
          orderDate: new Date(order.created_at).toLocaleDateString(),
        });
        console.log("✅ Purchase emails sent successfully");
      } catch (emailError) {
        console.warn("⚠️ Email service error (emails may still be queued):", emailError);
      }

      // Step 3: Create in-app notifications
      try {
        // Notification for buyer
        await NotificationService.createOrderConfirmation(
          order.buyer_id,
          order.id,
          bookTitle,
          false // isForSeller
        );
        console.log("✅ Buyer notification created");
      } catch (notifError) {
        console.warn("⚠️ Failed to create buyer notification:", notifError);
      }

      try {
        // Notification for seller
        await NotificationService.createOrderConfirmation(
          order.seller_id,
          order.id,
          bookTitle,
          true // isForSeller
        );
        console.log("✅ Seller notification created");
      } catch (notifError) {
        console.warn("⚠️ Failed to create seller notification:", notifError);
      }

      // Step 4: Update order status to pending_commit if still pending
      if (order.status === "pending" || order.payment_status === "pending") {
        try {
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              status: "pending_commit",
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          if (updateError) {
            console.warn("⚠️ Failed to update order status:", updateError);
          } else {
            console.log("✅ Order status updated to pending_commit");
          }
        } catch (updateError) {
          console.warn("⚠️ Order status update error:", updateError);
        }
      }

      console.log("✅ All post-payment actions completed");
    } catch (error) {
      console.error("❌ Post-payment actions failed:", error);
      // Don't throw - show success page anyway as order was created
    }
  };

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching order data for order_id:", reference);

      // Clean the reference - remove any suffixes like ":1" that may be appended by payment providers
      const cleanReference = reference ? reference.split(':')[0] : reference;
      console.log("Clean reference:", cleanReference);

      // Fetch the order directly from orders table using payment_reference
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_reference", cleanReference)
        .maybeSingle();

      if (orderError || !order) {
        console.error("Order not found:", orderError);
        setError("Order not found. Please check your reference number. Your payment may still be processing.");
        // Give user a longer time to see the error
        return;
      }

      console.log("Order found:", order);

      // Trigger post-payment actions as a fallback (webhook may have already done this)
      await handlePostPaymentActions(order);

      // Log that user visited the success page
      if (order.buyer_id) {
        try {
          await supabase
            .from("activity_logs")
            .insert({
              user_id: order.buyer_id,
              type: "purchase",
              title: `Order Confirmation Viewed - ${order.items?.[0]?.book_title || 'Book'}`,
              description: `Checkout completed for order #${order.id}`,
              metadata: {
                order_id: order.id,
                payment_reference: cleanReference,
              },
            })
            .then(() => console.log("✅ Success page visit logged"))
            .catch(err => console.error("Failed to log success page visit:", err));
        } catch (logError) {
          console.warn("Activity logging failed (non-critical):", logError);
        }
      }

      // Get the payment_reference from the order record
      const paymentReference = order.payment_reference || cleanReference;
      console.log("Payment reference from order:", paymentReference);

      // Extract book info from items array
      const bookItem = order.items?.[0];

      // Extract delivery info from delivery_data
      const deliveryData = order.delivery_data;

      // Extract metadata (includes buyer_id and platform fee)
      const metadata = order.metadata || {};

      // Construct OrderConfirmation object from order data
      const confirmation: OrderConfirmation = {
        order_id: order.payment_reference || order.id,
        payment_reference: paymentReference,
        book_id: bookItem?.book_id || "",
        seller_id: order.seller_id,
        buyer_id: metadata.buyer_id || "",
        book_title: bookItem?.book_title || "Book",
        book_price: bookItem?.price ? bookItem.price / 100 : 0, // Convert from kobo to rands
        delivery_method: deliveryData?.delivery_method || "Standard",
        delivery_price: deliveryData?.delivery_price ? deliveryData.delivery_price / 100 : 0, // Convert from kobo to rands
        platform_fee: metadata.platform_fee ? metadata.platform_fee / 100 : 20, // Convert from kobo to rands
        total_paid: order.amount ? order.amount / 100 : 0, // Convert from kobo to rands
        created_at: order.created_at || new Date().toISOString(),
        status: order.status || "pending",
      };

      setOrderData(confirmation);
    } catch (err) {
      console.error("Error fetching order data:", err);
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = () => {
    navigate("/profile", { state: { tab: "orders" } });
  };

  const handleContinueShopping = () => {
    navigate("/books");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Unable to Load Order</p>
              <p>{error}</p>
              <p className="text-sm text-gray-600 mt-2">
                Reference: {reference ? reference.split(':')[0] : 'N/A'}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
          <Button onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Order data could not be retrieved. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <Step4Confirmation
        orderData={orderData}
        onViewOrders={handleViewOrders}
        onContinueShopping={handleContinueShopping}
      />
    </div>
  );
};

export default CheckoutSuccess;
