import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EncryptedBundle {
  ciphertext: string
  iv: string
  authTag: string
  version?: number
}

function base64ToBytes(b64: string): Uint8Array {
  try {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch (_e) {
    throw new Error('INVALID_BASE64')
  }
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function getEncryptionKey(version?: number): string | null {
  const v = version ?? 1
  const keyVar = `ENCRYPTION_KEY_V${v}`
  const fallbackVar = 'ENCRYPTION_KEY'
  const key = Deno.env.get(keyVar) || Deno.env.get(fallbackVar) || null
  console.log(`Looking for encryption key: ${keyVar} or ${fallbackVar}, found: ${key ? 'yes' : 'no'}`)
  return key
}

async function importAesKeyForDecrypt(rawKeyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  let keyBytes: Uint8Array = enc.encode(rawKeyString)

  console.log(`Key string length: ${rawKeyString.length}, encoded bytes: ${keyBytes.byteLength}`)

  if (keyBytes.byteLength !== 32) {
    try {
      const b64 = base64ToBytes(rawKeyString)
      console.log(`Trying base64 decode, result bytes: ${b64.byteLength}`)
      if (b64.byteLength !== 32) {
        throw new Error('INVALID_KEY_LENGTH')
      }
      keyBytes = b64
    } catch (e) {
      console.error('Key import error:', e)
      throw new Error('INVALID_KEY_LENGTH')
    }
  }

  return crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, 'AES-GCM', false, ['decrypt'])
}

async function decryptGCM(bundle: EncryptedBundle, keyString: string): Promise<string> {
  if (!keyString) throw new Error('MISSING_KEY')

  const cryptoKey = await importAesKeyForDecrypt(keyString)
  const cipherBytes = base64ToBytes(bundle.ciphertext)
  const ivBytes = base64ToBytes(bundle.iv)
  const authTagBytes = base64ToBytes(bundle.authTag)

  const combined = new Uint8Array(cipherBytes.byteLength + authTagBytes.byteLength)
  combined.set(cipherBytes, 0)
  combined.set(authTagBytes, cipherBytes.byteLength)

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBytes),
        tagLength: 128,
      },
      cryptoKey,
      new Uint8Array(combined),
    )

    return bytesToString(new Uint8Array(decrypted))
  } catch (_e) {
    throw new Error('DECRYPTION_FAILED')
  }
}

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.log('No authorization header found')
    return null
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error) {
    console.error('Auth error:', error)
    return null
  }

  return user
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle()

  return !!data
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      console.error('Authentication failed - no user found')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please login first' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let targetUserId = user.id
    let body: { user_id?: string } = {}

    try {
      const text = await req.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (_e) {
      console.log('No JSON body or invalid JSON')
    }

    // If a different user_id is requested, check admin access
    if (body.user_id && body.user_id !== user.id) {
      const adminCheck = await isAdmin(supabase, user.id)
      if (!adminCheck) {
        console.error('Non-admin trying to access other user data')
        return new Response(
          JSON.stringify({ error: 'Forbidden - admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      targetUserId = body.user_id
    }

    console.log(`Fetching banking details for user: ${targetUserId}`)

    const { data: bankingDetails, error: fetchError } = await supabase
      .from('banking_subaccounts')
      .select('encrypted_account_number, encrypted_bank_code, encrypted_bank_name, encrypted_business_name, encrypted_email, encryption_key_hash')
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .maybeSingle()

    if (fetchError) {
      console.error('Database error:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error fetching banking details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!bankingDetails) {
      console.log('No banking details found for user:', targetUserId)
      return new Response(
        JSON.stringify({ error: 'No banking details found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hasEncryptedData = !!(
      bankingDetails.encrypted_account_number &&
      bankingDetails.encrypted_bank_code &&
      bankingDetails.encrypted_bank_name &&
      bankingDetails.encrypted_business_name
    )

    if (!hasEncryptedData) {
      console.error('Incomplete encrypted banking data for user:', targetUserId)
      return new Response(
        JSON.stringify({ error: 'Banking details incomplete - encryption required' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const encryptionKey = getEncryptionKey()
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'Encryption key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      const decryptedAccountNumber = await decryptGCM(
        bankingDetails.encrypted_account_number as unknown as EncryptedBundle,
        encryptionKey
      )
      const decryptedBankCode = await decryptGCM(
        bankingDetails.encrypted_bank_code as unknown as EncryptedBundle,
        encryptionKey
      )
      const decryptedBankName = await decryptGCM(
        bankingDetails.encrypted_bank_name as unknown as EncryptedBundle,
        encryptionKey
      )
      const decryptedBusinessName = await decryptGCM(
        bankingDetails.encrypted_business_name as unknown as EncryptedBundle,
        encryptionKey
      )

      let decryptedEmail: string | null = null
      if (bankingDetails.encrypted_email) {
        try {
          decryptedEmail = await decryptGCM(
            bankingDetails.encrypted_email as unknown as EncryptedBundle,
            encryptionKey
          )
        } catch (_) {
          console.warn('Failed to decrypt email, continuing without it')
        }
      }

      console.log('✅ Successfully decrypted banking details for user:', targetUserId)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            account_number: decryptedAccountNumber,
            bank_code: decryptedBankCode,
            bank_name: decryptedBankName,
            business_name: decryptedBusinessName,
            ...(decryptedEmail && { email: decryptedEmail })
          },
          encrypted: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (decryptError) {
      console.error('Failed to decrypt banking details:', decryptError)
      return new Response(
        JSON.stringify({ error: 'Failed to decrypt banking details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Unexpected error in decrypt-banking-details:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
