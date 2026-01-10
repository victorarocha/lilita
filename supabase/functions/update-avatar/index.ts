import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PICA_BASE = 'https://api.picaos.com/v1/passthrough'
const ACTION_SET_PROFILE_IMAGE = 'conn_mod_def::GCT_4EsnqcI::JakOn2mXRP-GrV1MikK9Fg'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    // Get env vars
    const PICA_SECRET = Deno.env.get('PICA_SECRET_KEY')
    const PICA_CLERK_CONN = Deno.env.get('PICA_CLERK_CONNECTION_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!PICA_SECRET || !PICA_CLERK_CONN) {
      console.error('[update-avatar] Missing Pica credentials')
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          code: 'CONFIG_ERROR',
          message: 'Missing PICA_SECRET_KEY or PICA_CLERK_CONNECTION_KEY'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Parse multipart form data
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type', code: 'INVALID_IMAGE', message: 'Expected multipart/form-data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const clerkUserId = formData.get('clerk_user_id') as string | null

    console.log('[update-avatar] Request received with clerk_user_id:', clerkUserId)

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded', code: 'INVALID_IMAGE', message: 'No file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing clerk_user_id', code: 'NOT_AUTHENTICATED', message: 'clerk_user_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('[update-avatar] Processing avatar update for user:', clerkUserId)
    console.log('[update-avatar] File info:', { name: file.name, type: file.type, size: file.size })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type', code: 'INVALID_IMAGE', message: `File type ${file.type} not supported` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large', code: 'INVALID_IMAGE', message: 'File size must be less than 5MB' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Build FormData to forward to Clerk via Pica Passthrough
    const clerkFormData = new FormData()
    clerkFormData.append('file', file, file.name || 'avatar.jpg')

    // Pica Passthrough URL for Clerk Set User Profile Image
    // Note: The path should NOT include the domain - Pica handles routing based on the connection key
    const clerkPassthroughUrl = `${PICA_BASE}/users/${encodeURIComponent(clerkUserId)}/profile_image`
    
    console.log('[update-avatar] Calling Clerk via Pica:', clerkPassthroughUrl)

    // Call Pica Passthrough -> Clerk
    const clerkResp = await fetch(clerkPassthroughUrl, {
      method: 'POST',
      headers: {
        'x-pica-secret': PICA_SECRET,
        'x-pica-connection-key': PICA_CLERK_CONN,
        'x-pica-action-id': ACTION_SET_PROFILE_IMAGE,
      },
      body: clerkFormData
    })

    if (!clerkResp.ok) {
      const errorText = await clerkResp.text()
      console.error('[update-avatar] Clerk API error:', { 
        status: clerkResp.status, 
        clerkUserId, 
        errorText 
      })
      
      // Try to parse error to extract clerk_trace_id
      let clerkError
      try {
        clerkError = JSON.parse(errorText)
        const traceId = clerkError?.errors?.[0]?.meta?.clerk_trace_id
        if (traceId) {
          console.error('[update-avatar] Clerk trace ID:', traceId)
        }
      } catch (e) {
        // Error text is not JSON
      }
      
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: 'CLERK_UPDATE_FAILED', 
          code: 'CLERK_UPDATE_FAILED', 
          message: clerkError?.errors?.[0]?.long_message || 'Failed to update profile image in Clerk',
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    const clerkUserObj = await clerkResp.json()
    console.log('[update-avatar] Clerk response received, has_image:', clerkUserObj.has_image)

    const avatarUrl = clerkUserObj.profile_image_url || clerkUserObj.image_url
    if (!avatarUrl) {
      return new Response(
        JSON.stringify({ error: 'No avatar URL returned', code: 'CLERK_UPDATE_FAILED', message: 'Clerk did not return an image URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('[update-avatar] New avatar URL:', avatarUrl)

    // Update customers table in Supabase (server-side using service role)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: updatedCustomer, error: supabaseError } = await supabase
      .from('customers')
      .update({ 
        avatar_url: avatarUrl, 
        updated_at: new Date().toISOString() 
      })
      .eq('clerk_user_id', clerkUserId)
      .select('*')
      .single()

    if (supabaseError) {
      console.error('[update-avatar] Supabase update error:', supabaseError)
      // Don't fail completely - Clerk update was successful
      return new Response(
        JSON.stringify({ 
          status: 'partial_success', 
          message: 'Clerk updated but database sync failed',
          code: 'DB_SYNC_FAILED',
          clerkUser: clerkUserObj,
          avatarUrl: avatarUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('[update-avatar] Customer avatar updated successfully:', updatedCustomer?.id)

    return new Response(
      JSON.stringify({
        status: 'success',
        customer: updatedCustomer,
        clerkUser: clerkUserObj,
        avatarUrl: avatarUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[update-avatar] Error:', error)
    return new Response(
      JSON.stringify({ error: 'UPLOAD_FAILED', code: 'UPLOAD_FAILED', message: error.message ?? String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
