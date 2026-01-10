import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyTotpRequest {
  user_id: string;
  code: string;
}

interface VerifyTotpSuccessResponse {
  verified: boolean;
  code_type: 'totp' | 'backup_code';
}

interface ClerkError {
  message: string;
  long_message: string;
  code: string;
  meta?: {
    clerk_trace_id?: string;
  };
}

interface ClerkErrorResponse {
  errors: ClerkError[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // Validate environment variables
    const picaSecretKey = Deno.env.get('PICA_SECRET_KEY');
    const picaConnectionKey = Deno.env.get('PICA_CLERK_CONNECTION_KEY');

    if (!picaSecretKey || !picaConnectionKey) {
      console.error('[verify-totp] Missing required environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'configuration_error', 
          message: 'Server is not properly configured for TOTP verification' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse and validate request
    const json: VerifyTotpRequest = await req.json();
    
    if (!json?.user_id || !json?.code) {
      return new Response(
        JSON.stringify({ 
          error: 'invalid_request', 
          message: 'user_id and code are required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const userId = String(json.user_id);
    const code = String(json.code);

    // Do NOT log the code itself for security
    console.log('[verify-totp] Verifying TOTP for user_id:', userId);

    // Build Pica Passthrough URL
    const picaUrl = `https://api.picaos.com/v1/passthrough/users/${encodeURIComponent(userId)}/verify_totp`;
    
    const res = await fetch(picaUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-pica-secret': picaSecretKey,
        'x-pica-connection-key': picaConnectionKey,
        'x-pica-action-id': 'conn_mod_def::GCT_27_BqhQ::dxvLqN2FR_OVi-BZqCsUww'
      },
      body: JSON.stringify({ code })
    });

    const data = await res.json().catch(() => null);
    console.log('[verify-totp] Pica response status:', res.status);

    if (res.ok) {
      // 200 — success
      const successData = data as VerifyTotpSuccessResponse;
      console.log('[verify-totp] TOTP verified successfully, code_type:', successData.code_type);
      return new Response(
        JSON.stringify(successData), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Handle error responses
    const errorData = data as ClerkErrorResponse;
    const clerkTraceId = errorData?.errors?.[0]?.meta?.clerk_trace_id;
    
    if (clerkTraceId) {
      console.log('[verify-totp] Clerk trace ID:', clerkTraceId);
    }

    if (res.status === 422) {
      // Incorrect TOTP / backup code
      console.log('[verify-totp] Invalid code provided');
      return new Response(
        JSON.stringify({ 
          error: 'invalid_code', 
          message: 'The verification code is incorrect. Please try again.',
          details: errorData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 }
      );
    }

    if (res.status === 404) {
      console.log('[verify-totp] User not found');
      return new Response(
        JSON.stringify({ error: 'user_not_found', message: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (res.status === 400) {
      console.log('[verify-totp] TOTP not configured for user');
      return new Response(
        JSON.stringify({ 
          error: 'totp_not_configured', 
          message: 'Two-factor authentication is not configured for this account' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generic server error
    console.error('[verify-totp] Server error from Clerk:', data);
    return new Response(
      JSON.stringify({ 
        error: 'server_error', 
        clerk_trace_id: clerkTraceId, 
        details: errorData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );

  } catch (err) {
    console.error('[verify-totp] Unexpected error:', err);
    return new Response(
      JSON.stringify({ 
        error: 'unexpected_error', 
        message: String(err) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
