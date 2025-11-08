-- Migration: Remove subaccount_code requirement from RLS policies
-- Allow sellers to create listings and proceed in checkout WITHOUT banking setup

-- Drop ALL existing policies on books table to clean slate
DROP POLICY IF EXISTS "books_encrypted_address_access" ON books;
DROP POLICY IF EXISTS "Authenticated users can create their own books" ON books;
DROP POLICY IF EXISTS "Users can view their own books or public books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;
DROP POLICY IF EXISTS "Service role can manage all books" ON books;

-- Ensure RLS is enabled
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- ✅ NEW CLEAN POLICIES - No subaccount_code requirement

-- Policy 1: Authenticated users can INSERT their own books (NO subaccount requirement)
CREATE POLICY "Authenticated users can create books"
  ON books
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id AND auth.uid() IS NOT NULL);

-- Policy 2: Users can SELECT their own books or public books
CREATE POLICY "Users can view books"
  ON books
  FOR SELECT
  USING (
    auth.uid() = seller_id OR
    status = 'available' OR
    auth.uid() IS NULL
  );

-- Policy 3: Users can UPDATE only their own books
CREATE POLICY "Users can update own books"
  ON books
  FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Policy 4: Users can DELETE only their own books
CREATE POLICY "Users can delete own books"
  ON books
  FOR DELETE
  USING (auth.uid() = seller_id);

-- Policy 5: Service role can manage everything (for admin/edge functions)
CREATE POLICY "Service role manages all books"
  ON books
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Verify policies are set correctly
COMMENT ON POLICY "Authenticated users can create books" ON books 
  IS 'Allows any authenticated user to create books they own. NO banking/subaccount requirement.';

COMMENT ON POLICY "Users can view books" ON books 
  IS 'Users see their own books, others see available books, anonymous sees available books';

COMMENT ON POLICY "Users can update own books" ON books 
  IS 'Users can only update books they own (seller_id matches auth.uid())';

COMMENT ON POLICY "Users can delete own books" ON books 
  IS 'Users can only delete books they own';

COMMENT ON POLICY "Service role manages all books" ON books 
  IS 'Backend/admin service role can perform any operation for system tasks';
