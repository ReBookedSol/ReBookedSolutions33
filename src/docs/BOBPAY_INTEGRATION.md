# BobPay Integration Guide

This document explains how the BobPay integration works in the ReBooked Solutions application.

## Edge Functions

### 1. bobpay-initialize-payment
**Location:** `supabase/functions/bobpay-initialize-payment/index.ts`

Creates a payment link for customers to complete their payment.

**Request Body:**
```typescript
{
  amount: number;                 // Amount in ZAR
  email: string;                  // Customer email
  mobile_number?: string;         // Customer phone (optional)
  item_name: string;              // Product name
  item_description?: string;      // Product description
  custom_payment_id: string;      // Order ID (for tracking)
  order_id?: string;              // Order ID (for database)
  buyer_id?: string;              // Buyer ID (for database)
  notify_url: string;             // Webhook URL
  success_url: string;            // URL after successful payment
  pending_url: string;            // URL after pending payment
  cancel_url: string;             // URL after cancelled payment
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    payment_url: string;          // URL to redirect user to BobPay
    short_url: string;            // Shortened payment URL
    reference: string;            // Payment reference ID
  };
  error?: string;
}
```

**Usage in Checkout:**
```typescript
import { initializeBobPayCheckout } from '@/utils/bobpayCheckoutHelper';

const handleBobPayCheckout = async () => {
  const result = await initializeBobPayCheckout({
    userId,
    email: userData.user.email,
    orderSummary,
    mobileNumber: userData.user.phone,
  });
  // User will be redirected to BobPay payment page
};
```

### 2. bobpay-webhook
**Location:** `supabase/functions/bobpay-webhook/index.ts`

Handles payment notifications from BobPay.

**Features:**
- Verifies BobPay IP addresses
- Validates payment signature using MD5 hash
- Updates order and payment transaction status
- Creates notifications for buyers and sellers

**Called automatically by BobPay** - no manual invocation needed.

**Webhook URL Configuration:**
```
https://{project-id}.supabase.co/functions/v1/bobpay-webhook
```

### 3. bobpay-refund
**Location:** `supabase/functions/bobpay-refund/index.ts`

Processes refunds for BobPay orders.

**Request Body:**
```typescript
{
  order_id: string;       // Order to refund
  payment_id?: number;    // Payment ID (optional, detected from order if not provided)
  reason?: string;        // Reason for refund
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    refund_id: string;
    amount: number;
    status: string;
    message: string;
  };
  error?: string;
}
```

**Usage in Order Cancellation:**
```typescript
import { refundOrderForBuyer } from '@/utils/refundHandler';

const handleCancel = async () => {
  const result = await refundOrderForBuyer(orderId, 'User requested cancellation');
  if (result.success) {
    toast.success(result.message);
  } else {
    toast.error(result.message);
  }
};
```

## Services

### BobPayService
**Location:** `src/services/bobpayService.ts`

Provides utility functions for BobPay operations.

```typescript
import { initializeBobPayPayment, processBobPayRefund } from '@/services/bobpayService';

// Initialize payment
const response = await initializeBobPayPayment({
  amount: 999.99,
  email: 'customer@example.com',
  // ... other required fields
});

// Process refund
const refundResult = await processBobPayRefund({
  order_id: 'order-123',
  reason: 'Customer requested refund',
});
```

### Refund Handler
**Location:** `src/utils/refundHandler.ts`

Intelligent refund handler that detects payment provider (BobPay or Paystack) and calls the appropriate refund function.

```typescript
import { handleIntelligentRefund } from '@/utils/refundHandler';

// Automatically detects and handles refund for either BobPay or Paystack
const result = await handleIntelligentRefund({
  order_id: 'order-123',
  reason: 'Order cancellation',
});
```

## Required Environment Variables

Set these in your Supabase project settings under Edge Functions:

```
BOBPAY_API_URL=https://api.sandbox.bobpay.co.za
BOBPAY_API_TOKEN=your_bearer_token
BOBPAY_ACCOUNT_CODE=your_account_code
BOBPAY_PASSPHRASE=your_passphrase
BOBPAY_ENV=sandbox  # or "production"
```

## Integration Points

### 1. Checkout Payment
**File:** `src/components/checkout/Step3Payment.tsx`

Replace Paystack integration with BobPay:
```typescript
import BobPayPopup from '@/components/BobPayPopup';

<BobPayPopup
  email={userEmail}
  amount={orderSummary.total_price}
  orderId={orderId}
  buyerId={userId}
  itemName={`Order #${orderId}`}
  onSuccess={handlePaymentSuccess}
  onClose={handlePaymentClose}
/>
```

### 2. Order Cancellation (Buyer)
**File:** `src/components/orders/OrderActionsPanel.tsx`

Uses intelligent refund handler to handle both BobPay and Paystack:
```typescript
const result = await refundOrderForBuyer(order.id, cancelReason);
if (result.success) {
  toast.success(result.message);
} else {
  toast.error(result.message);
}
```

### 3. Order Decline (Seller)
**File:** `src/components/orders/OrderDeclineButton.tsx`

Uses intelligent refund handler for declines:
```typescript
const result = await refundOrderForDecline(orderId, declineReason);
```

## Payment Flow

1. **Customer initiates checkout** → Frontend calls `bobpay-initialize-payment`
2. **Payment link created** → Customer redirected to BobPay payment page
3. **Customer completes payment** → BobPay sends webhook to `bobpay-webhook`
4. **Webhook validates** → Signature verified, payment validated with BobPay API
5. **Order updated** → Order status changed to paid, notifications sent
6. **Customer redirected** → To success/pending/cancel URL based on payment status

## Refund Flow

1. **Refund requested** → Frontend calls intelligent refund handler
2. **Provider detected** → System identifies if payment is BobPay or Paystack
3. **Appropriate function called** → `bobpay-refund` or `refund-management`
4. **Eligibility checked** → System validates refund eligibility
5. **BobPay API called** → Refund reversal initiated
6. **Records updated** → Refund transaction recorded, order status updated
7. **Notifications sent** → Both buyer and seller notified

## Testing

### Sandbox Credentials
- URL: `https://api.sandbox.bobpay.co.za`
- Account Code: `SAN001` (or your test account)
- Passphrase: `0W5LORYafx`
- Test Cards: Provided by BobPay dashboard

### Test Payment Flow
1. Set `BOBPAY_ENV=sandbox` in environment variables
2. Initiate payment with test amount
3. Complete payment using test card
4. Verify webhook receipt and order status update

### Test Refund Flow
1. Create a test order with BobPay payment
2. Call refund function with order ID
3. Verify refund status updates in database
4. Check refund notifications sent to users

## Migration from Paystack

The system uses the same `paystack_response` and `paystack_reference` columns for both Paystack and BobPay data, with a `provider` flag to distinguish:

```typescript
// BobPay response stored in paystack_response
paystack_response: {
  ...bobpay_data,
  provider: 'bobpay'  // Key indicator
}

// Paystack response (no provider flag or provider: 'paystack')
paystack_response: {
  ...paystack_data,
  provider: 'paystack'
}
```

No database schema changes required.

## Support

For BobPay API issues:
- Email: support@bobpay.co.za
- Sandbox Dashboard: https://sandbox.bobpay.co.za
- Production Dashboard: https://my.bobpay.co.za

For application integration issues:
- Contact: support@rebookedsolutions.co.za
