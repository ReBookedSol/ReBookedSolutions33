-- Create the coupons table
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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active, valid_until);

-- Create the coupon_redemptions table (for detailed tracking)
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  discount_applied DECIMAL(10, 2) NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(coupon_id, user_id, order_id)
);

-- Create indexes for coupon_redemptions
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON public.coupon_redemptions(order_id);

-- Enable Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupons table
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true AND valid_until > CURRENT_TIMESTAMP);

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

-- RLS policies for coupon_redemptions table
CREATE POLICY "Users can view their own redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert redemptions"
  ON public.coupon_redemptions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create the validate_coupon function
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code TEXT, p_subtotal DECIMAL)
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
