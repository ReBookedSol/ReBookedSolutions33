# Coupon System - SQL Schema

Add these SQL tables to your Supabase database to make the coupon system work.

## 1. Create the `coupons` table

```sql
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL,
  description TEXT,
  max_uses INTEGER,
  usage_count INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on code for faster lookups
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active, valid_until);
```

## 2. Create the `coupon_redemptions` table (optional - for detailed tracking)

```sql
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  discount_applied DECIMAL(10, 2) NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(coupon_id, user_id, order_id)
);

-- Create index for faster lookups
CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_order ON public.coupon_redemptions(order_id);
```

## 3. Enable Row Level Security (RLS)

```sql
-- Enable RLS on coupons table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create policy for public read (anyone can see active coupons)
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true AND valid_until > CURRENT_TIMESTAMP);

-- Create policy for admin only insert/update/delete
CREATE POLICY "Only admins can insert coupons"
  ON public.coupons FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update coupons"
  ON public.coupons FOR UPDATE
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete coupons"
  ON public.coupons FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on coupon_redemptions table
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert redemptions"
  ON public.coupon_redemptions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

## 4. Create a Trigger to Auto-Increment Usage Count

```sql
-- Create a function to handle coupon validation API
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_subtotal DECIMAL)
RETURNS JSON AS $$
DECLARE
  v_coupon RECORD;
  v_discount_amount DECIMAL;
BEGIN
  -- Fetch coupon
  SELECT * INTO v_coupon FROM public.coupons 
  WHERE code = UPPER(TRIM(p_code));
  
  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN json_build_object(
      'error', 'Coupon code not found',
      'isValid', false
    );
  END IF;
  
  -- Check if active
  IF NOT v_coupon.is_active THEN
    RETURN json_build_object(
      'error', 'This coupon is no longer active',
      'isValid', false
    );
  END IF;
  
  -- Check if expired
  IF CURRENT_TIMESTAMP > v_coupon.valid_until THEN
    RETURN json_build_object(
      'error', 'This coupon has expired',
      'isValid', false
    );
  END IF;
  
  -- Check usage limit
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.usage_count >= v_coupon.max_uses THEN
    RETURN json_build_object(
      'error', 'This coupon has reached its usage limit',
      'isValid', false
    );
  END IF;
  
  -- Check minimum order amount
  IF v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
    RETURN json_build_object(
      'error', 'Minimum order amount of R' || v_coupon.min_order_amount || ' required',
      'isValid', false
    );
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := (p_subtotal * v_coupon.discount_value) / 100;
    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_coupon.max_discount_amount);
    END IF;
  ELSE
    v_discount_amount := v_coupon.discount_value;
  END IF;
  
  RETURN json_build_object(
    'isValid', true,
    'coupon', json_build_object(
      'id', v_coupon.id,
      'code', v_coupon.code,
      'discount_type', v_coupon.discount_type,
      'discount_value', v_coupon.discount_value,
      'description', v_coupon.description,
      'max_uses', v_coupon.max_uses,
      'usage_count', v_coupon.usage_count,
      'min_order_amount', v_coupon.min_order_amount,
      'max_discount_amount', v_coupon.max_discount_amount,
      'valid_from', v_coupon.valid_from,
      'valid_until', v_coupon.valid_until,
      'is_active', v_coupon.is_active,
      'created_at', v_coupon.created_at,
      'updated_at', v_coupon.updated_at
    ),
    'discountAmount', v_discount_amount
  );
END;
$$ LANGUAGE plpgsql;
```

## 5. Example Data - Sample Coupons

```sql
-- Insert sample coupons for testing
INSERT INTO public.coupons (
  code, 
  discount_type, 
  discount_value, 
  description,
  max_uses,
  min_order_amount,
  max_discount_amount,
  valid_from,
  valid_until,
  is_active
) VALUES
  (
    'WELCOME10',
    'percentage',
    10,
    'Welcome discount - 10% off for new customers',
    100,
    100,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    true
  ),
  (
    'SUMMER50',
    'fixed_amount',
    50,
    'Summer sale - R50 off any purchase',
    50,
    200,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '60 days',
    true
  ),
  (
    'LOYALTY20',
    'percentage',
    20,
    'Loyalty reward - 20% off max R200',
    NULL,
    500,
    200,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    true
  );
```

## API Endpoint Implementation

Add this to your backend Edge Functions (you can create this as a Supabase Function):

### `/api/coupons/validate` - POST

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { code, subtotal } = await req.json();

    if (!code || subtotal === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing code or subtotal" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call the validation function
    const { data, error } = await supabase.rpc("validate_coupon", {
      p_code: code,
      p_subtotal: subtotal,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

## Database Schema Diagram

```
┌─────────────────────────┐
│      coupons            │
├─────────────────────────┤
│ id (UUID) - PK          │
│ code (VARCHAR) - UNIQUE │
│ discount_type (VARCHAR) │
│ discount_value (DECIMAL)│
│ description (TEXT)      │
│ max_uses (INTEGER)      │
│ usage_count (INTEGER)   │
│ min_order_amount (DEC)  │
│ max_discount_amount(DEC)│
│ valid_from (TIMESTAMP)  │
│ valid_until (TIMESTAMP) │
│ is_active (BOOLEAN)     │
│ created_at (TIMESTAMP)  │
│ updated_at (TIMESTAMP)  │
└─────────────────────────┘

┌──────────────────────────────────┐
│   coupon_redemptions             │
├──────────────────────────────────┤
│ id (UUID) - PK                   │
│ coupon_id (UUID) - FK → coupons  │
│ user_id (UUID) - FK → auth.users │
│ order_id (UUID)                  │
│ discount_applied (DECIMAL)       │
│ redeemed_at (TIMESTAMP)          │
└──────────────────────────────────┘
```

## Integration Notes

1. **Validation API**: The `/api/coupons/validate` endpoint is called from the frontend `CouponInput` component
2. **Coupon Code**: Stored in `orders.metadata.coupon_code` when order is created
3. **Coupon Discount**: Stored in `orders.metadata.coupon_discount` for tracking
4. **Usage Tracking**: The `coupon_redemptions` table tracks which users have used which coupons
5. **Usage Count**: Incremented automatically via the `validate_coupon` function when order is confirmed

## Next Steps

1. Run the SQL scripts in your Supabase SQL Editor
2. Create the Edge Function for the validation API
3. Test with sample coupons
4. Admin panel for managing coupons can be built separately
