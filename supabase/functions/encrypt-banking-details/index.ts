import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EncryptedBundle {
  ciphertext: string
  iv: string
  authTag: string
  version?: number
}

interface BankingEncryptionRequest {
  account_number: string
  bank_code: string
  bank_name?: string
  business_name?: string
  email?: string
  subaccount_code?: string
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function getEncryptionKey(version?: number): string | null {
  const v = version ?? 1
  const keyVar = `ENCRYPTION_KEY_V${v}`
  const fallbackVar = 'ENCRYPTION_KEY'
  const key = Deno.env.get(keyVar) || Deno.env.get(fallbackVar) || null
  return key
}

async function importAesKey(rawKeyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  let keyBytes: Uint8Array = enc.encode(rawKeyString)

  if (keyBytes.byteLength !== 32) {
    try {
      const b64 = base64ToBytes(rawKeyString)
      if (b64.byteLength !== 32) {
        throw new Error('INVALID_KEY_LENGTH')
      }
      keyBytes = new Uint8Array(b64)
    } catch (_e) {
      throw new Error('INVALID_KEY_LENGTH')
    }
  }

  // @ts-ignore - Deno edge runtime types
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
}

function getOrGenerateIv(): { ivBytes: Uint8Array; ivB64: string } {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12))
  const ivB64 = bytesToBase64(ivBytes)
  return { ivBytes, ivB64 }
}

async function encryptGCM(plaintext: string, keyString: string, version?: number): Promise<EncryptedBundle> {
  if (!keyString) throw new Error('MISSING_KEY')

  const cryptoKey = await importAesKey(keyString)
  const { ivBytes, ivB64 } = getOrGenerateIv()

  try {
    const encoded = new TextEncoder().encode(plaintext)
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBytes),
        tagLength: 128,
      },
      cryptoKey,
      new Uint8Array(encoded),
    )

    const full = new Uint8Array(encrypted)
    if (full.byteLength < 16) throw new Error('ENCRYPTION_FAILED')
    const tagBytes = full.slice(full.byteLength - 16)
    const cipherBytes = full.slice(0, full.byteLength - 16)

    return {
      ciphertext: bytesToBase64(cipherBytes),
      iv: ivB64,
      authTag: bytesToBase64(tagBytes),
      version,
    }
  } catch (_e) {
    throw new Error('ENCRYPTION_FAILED')
  }
}

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Encrypt Banking Details Request ===')

    const user = await getUserFromRequest(req)
    if (!user) {
      console.error('Authentication failed - no user found')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - please login first' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated user:', user.id)

    let body: Partial<BankingEncryptionRequest> = {}
    try {
      body = await req.json()
    } catch (_e) {
      // No body provided is fine; we'll fall back to DB values
    }

    const { account_number, bank_code, bank_name, business_name, email } = body

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: row, error: rowError } = await supabase
      .from('banking_subaccounts')
      .select('id, encrypted_account_number, encrypted_bank_code, encrypted_bank_name, encrypted_business_name, encrypted_email, account_number, bank_code, bank_name, business_name, email')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (rowError || !row) {
      return new Response(
        JSON.stringify({ success: false, error: 'No banking record found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const source = {
      account_number: account_number ?? row.account_number ?? null,
      bank_code: bank_code ?? row.bank_code ?? null,
      bank_name: bank_name ?? row.bank_name ?? null,
      business_name: business_name ?? row.business_name ?? null,
      email: email ?? row.email ?? null,
    }

    const encryptionKey = getEncryptionKey()
    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Encryption key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      const updates: Record<string, string> = {}
      const responseData: Record<string, EncryptedBundle> = {}
      const updatedFields: string[] = []

      if (!row.encrypted_account_number && source.account_number) {
        const b = await encryptGCM(source.account_number, encryptionKey, 1)
        updates.encrypted_account_number = JSON.stringify(b)
        responseData.encrypted_account_number = b
        updatedFields.push('account_number')
      }
      if (!row.encrypted_bank_code && source.bank_code) {
        const b = await encryptGCM(source.bank_code, encryptionKey, 1)
        updates.encrypted_bank_code = JSON.stringify(b)
        responseData.encrypted_bank_code = b
        updatedFields.push('bank_code')
      }
      if (!row.encrypted_bank_name && source.bank_name) {
        const b = await encryptGCM(source.bank_name, encryptionKey, 1)
        updates.encrypted_bank_name = JSON.stringify(b)
        responseData.encrypted_bank_name = b
        updatedFields.push('bank_name')
      }
      if (!row.encrypted_business_name && source.business_name) {
        const b = await encryptGCM(source.business_name, encryptionKey, 1)
        updates.encrypted_business_name = JSON.stringify(b)
        responseData.encrypted_business_name = b
        updatedFields.push('business_name')
      }
      if (!row.encrypted_email && source.email) {
        const b = await encryptGCM(source.email, encryptionKey, 1)
        updates.encrypted_email = JSON.stringify(b)
        responseData.encrypted_email = b
        updatedFields.push('email')
      }

      if (updatedFields.length === 0) {
        console.log('No fields to encrypt for user:', user.id)
        return new Response(
          JSON.stringify({ success: true, updatedFields: [], message: 'Nothing to encrypt' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateError } = await supabase
        .from('banking_subaccounts')
        .update(updates)
        .eq('id', row.id)

      if (updateError) {
        console.error('Failed updating encrypted fields:', updateError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to save encrypted data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Encrypted fields for user', user.id, updatedFields)
      return new Response(
        JSON.stringify({ success: true, updatedFields, data: responseData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (encryptError) {
      console.error('Failed to encrypt banking details:', encryptError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to encrypt banking details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Unexpected error in encrypt-banking-details:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
