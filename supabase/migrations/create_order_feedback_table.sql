-- Create order_feedback table for buyer delivery confirmation and feedback
CREATE TABLE IF NOT EXISTS public.order_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  received BOOLEAN NOT NULL,
  received_status TEXT NOT NULL CHECK (received_status IN ('received', 'not_received')),
  comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_order_feedback_order 
    FOREIGN KEY (order_id) 
    REFERENCES public.orders(id) 
    ON DELETE CASCADE
);

-- Add index for quick lookups by order
CREATE INDEX idx_order_feedback_order_id ON public.order_feedback(order_id);
CREATE INDEX idx_order_feedback_submitted_at ON public.order_feedback(submitted_at);

-- Add RLS policies
ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;

-- Buyers can only see and create feedback for their own orders
CREATE POLICY "Buyers can view their order feedback"
  ON public.order_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_feedback.order_id 
      AND orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can insert their order feedback"
  ON public.order_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_feedback.order_id 
      AND orders.buyer_id = auth.uid()
    )
  );

-- Sellers can view feedback on their orders
CREATE POLICY "Sellers can view feedback on their orders"
  ON public.order_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_feedback.order_id 
      AND orders.seller_id = auth.uid()
    )
  );

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.order_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
