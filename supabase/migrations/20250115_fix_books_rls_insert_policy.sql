-- Migration: Fix books table RLS to allow authenticated users to insert new books
-- The existing policy requires auth.uid() = seller_id, but we need to explicitly
-- allow authenticated users to INSERT with their own seller_id

-- Drop the overly restrictive policy if it exists
DROP POLICY IF EXISTS "books_encrypted_address_access" ON books;

-- Enable RLS on books table if not already enabled
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can INSERT their own books
-- (seller_id must match the current authenticated user)
CREATE POLICY "Authenticated users can create their own books"
  ON books
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id AND auth.uid() IS NOT NULL);

-- Policy 2: Users can SELECT their own books or publicly available books
CREATE POLICY "Users can view their own books or public books"
  ON books
  FOR SELECT
  USING (
    auth.uid() = seller_id OR
    status = 'available' OR
    auth.uid() IS NULL  -- Allow anonymous access to view available books
  );

-- Policy 3: Users can UPDATE their own books
CREATE POLICY "Users can update their own books"
  ON books
  FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Policy 4: Users can DELETE their own books
CREATE POLICY "Users can delete their own books"
  ON books
  FOR DELETE
  USING (auth.uid() = seller_id);

-- Policy 5: Service role can manage all books (for admin/backend operations)
CREATE POLICY "Service role can manage all books"
  ON books
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_seller_id ON books(seller_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
