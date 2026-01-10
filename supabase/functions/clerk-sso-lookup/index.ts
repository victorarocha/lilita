import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PICA_BASE = 'https://api.picaos.com/v1/passthrough'
const ACTION_RETRIEVE_USER = 'conn_mod_def::GCT_31Q-7fo::pym2V-IETdaZ-7BJwSQTSA'
const ACTION_OAUTH_TOKENS = 'conn_mod_def::GCT_2qHlbF8::W3jOzazpTz-ZFXJUpZO18w'

function getHeadersForAction(actionId: string) {
  const PICA_SECRET = Deno.env.get('PICA_SECRET_KEY')
  const PICA_CLERK_CONN = Deno.env.get('PICA_CLERK_CONNECTION_KEY')
  if (!PICA_SECRET || !PICA_CLERK_CONN) {
    throw new Error('Missing PICA_SECRET_KEY or PICA_CLERK_CONNECTION_KEY environment variables')
  }
  return {
    'Accept': 'application/json',
    'x-pica-secret': PICA_SECRET,
    'x-pica-connection-key': PICA_CLERK_CONN,
    'x-pica-action-id': actionId
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const body = await req.json()
    const { user_id, provider } = body

    if (!user_id || typeof user_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'user_id (Clerk user id) is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check for required env vars
    const PICA_SECRET = Deno.env.get('PICA_SECRET_KEY')
    const PICA_CLERK_CONN = Deno.env.get('PICA_CLERK_CONNECTION_KEY')
    
    if (!PICA_SECRET || !PICA_CLERK_CONN) {
      console.error('[clerk-sso-lookup] Missing Pica credentials')
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          message: 'Missing PICA_SECRET_KEY or PICA_CLERK_CONNECTION_KEY'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 1) Retrieve Clerk User via Pica Passthrough
    const userUrl = `${PICA_BASE}/users/${encodeURIComponent(user_id)}`
    console.log('[clerk-sso-lookup] Fetching Clerk user:', user_id)
    
    const userResp = await fetch(userUrl, {
      method: 'GET',
      headers: getHeadersForAction(ACTION_RETRIEVE_USER)
    })
    
    if (!userResp.ok) {
      const errText = await userResp.text()
      console.error('[clerk-sso-lookup] Failed fetching Clerk user:', errText)
      return new Response(
        JSON.stringify({ error: 'Failed fetching Clerk user', detail: errText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: userResp.status }
      )
    }
    
    const clerkUser = await userResp.json()

    // Extract primary email/name safely from clerkUser
    let email: string | null = null
    if (Array.isArray(clerkUser.email_addresses) && clerkUser.email_addresses.length) {
      const primary = clerkUser.email_addresses.find((e: any) => e.id === clerkUser.primary_email_address_id) ?? clerkUser.email_addresses[0]
      email = primary?.email_address ?? null
    } else if (clerkUser.email) {
      email = clerkUser.email
    }
    
    const firstName = clerkUser.first_name ?? null
    const lastName = clerkUser.last_name ?? null
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || clerkUser.public_metadata?.name || null

    // 2) Optionally retrieve OAuth access tokens for provider
    let oauthTokens: any[] = []
    if (provider && typeof provider === 'string') {
      const providerUrl = `${PICA_BASE}/users/${encodeURIComponent(user_id)}/oauth_access_tokens/${encodeURIComponent(provider)}`
      console.log('[clerk-sso-lookup] Fetching OAuth tokens for provider:', provider)
      
      const tokenResp = await fetch(providerUrl, {
        method: 'GET',
        headers: getHeadersForAction(ACTION_OAUTH_TOKENS)
      })
      
      if (tokenResp.ok) {
        oauthTokens = await tokenResp.json()
      } else {
        const tokenErrText = await tokenResp.text()
        console.warn('[clerk-sso-lookup] Failed to retrieve provider tokens:', tokenErrText)
        oauthTokens = [{ error: true, message: 'failed to retrieve provider tokens' }]
      }
    }

    // 3) Build sync payload for server-side syncCustomer
    const customerSyncIntent = {
      clerk_user_id: clerkUser.id,
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName
    }

    // 4) Now sync the customer to our database using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let syncedCustomer = null
    let created = false

    if (email) {
      // First, check if customer exists by email
      const { data: existingByEmail, error: emailError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (existingByEmail) {
        // If customer exists but no clerk_user_id, link them
        if (!existingByEmail.clerk_user_id) {
          console.log('[clerk-sso-lookup] Linking existing customer to Clerk user')
          const { data: updatedCustomer, error: updateError } = await supabase
            .from('customers')
            .update({
              clerk_user_id: clerkUser.id,
              first_name: firstName || existingByEmail.first_name,
              last_name: lastName || existingByEmail.last_name,
              full_name: fullName || existingByEmail.full_name,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingByEmail.id)
            .select()
            .single()

          if (updateError) {
            console.error('[clerk-sso-lookup] Error linking customer:', updateError)
          } else {
            syncedCustomer = updatedCustomer
          }
        } else {
          syncedCustomer = existingByEmail
        }
      } else {
        // Check if customer exists by clerk_user_id
        const { data: existingByClerkId } = await supabase
          .from('customers')
          .select('*')
          .eq('clerk_user_id', clerkUser.id)
          .maybeSingle()

        if (existingByClerkId) {
          syncedCustomer = existingByClerkId
        } else {
          // Create new customer
          console.log('[clerk-sso-lookup] Creating new customer for Clerk user')
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              clerk_user_id: clerkUser.id,
              email: email,
              first_name: firstName,
              last_name: lastName,
              full_name: fullName
            })
            .select()
            .single()

          if (createError) {
            console.error('[clerk-sso-lookup] Error creating customer:', createError)
          } else {
            syncedCustomer = newCustomer
            created = true
          }
        }
      }
    }

    console.log('[clerk-sso-lookup] Complete, customer:', syncedCustomer?.id)

    return new Response(
      JSON.stringify({
        clerkUser,
        oauthTokens,
        customerSyncIntent,
        customer: syncedCustomer,
        created
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('[clerk-sso-lookup] Error:', error)
    return new Response(
      JSON.stringify({ error: 'internal_error', message: error.message ?? String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
