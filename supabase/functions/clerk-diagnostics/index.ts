import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PICA_BASE = "https://api.picaos.com/v1/passthrough";

// Action IDs from Pica getAvailableActions
const ACTION_LIST_USERS = "conn_mod_def::GCT_3jssiuE::29aDwR0jRu6v1GwufLSEUg";
const ACTION_RETRIEVE_USER = "conn_mod_def::GCT_31Q-7fo::pym2V-IETdaZ-7BJwSQTSA";
const ACTION_DISABLE_USER_MFA = "conn_mod_def::GCT_3HyZMsU::zsfjMjV_TWySxjDzsfkV5A";

function commonHeaders(actionId: string) {
  const picaSecret = Deno.env.get('PICA_SECRET_KEY');
  const picaConn = Deno.env.get('PICA_CLERK_CONNECTION_KEY');
  
  return {
    "Content-Type": "application/json",
    "x-pica-secret": picaSecret ?? "",
    "x-pica-connection-key": picaConn ?? "",
    "x-pica-action-id": actionId
  };
}

async function verifyConnection() {
  const url = `${PICA_BASE}/users?limit=1`;
  console.log('[clerk-diagnostics] Verifying connection...');
  
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: commonHeaders(ACTION_LIST_USERS)
    });
    
    const body = await res.text();
    let json;
    try { json = JSON.parse(body); } catch (e) { json = body; }
    
    console.log('[clerk-diagnostics] Connection verify status:', res.status);
    return { 
      status: res.status, 
      ok: res.ok, 
      body: json 
    };
  } catch (error) {
    console.error('[clerk-diagnostics] Connection error:', error);
    return { 
      status: 500, 
      ok: false, 
      body: { error: String(error) } 
    };
  }
}

async function listUsers(email?: string, limit: number = 20) {
  const qp = new URLSearchParams();
  if (email) qp.append("email_address", email);
  qp.append("limit", String(limit));
  
  const url = `${PICA_BASE}/users?${qp.toString()}`;
  console.log('[clerk-diagnostics] Listing users with email:', email);
  
  const res = await fetch(url, { 
    method: "GET", 
    headers: commonHeaders(ACTION_LIST_USERS) 
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error('[clerk-diagnostics] List users failed:', res.status, text);
    throw new Error(`List users failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

async function retrieveUser(userId: string) {
  const encoded = encodeURIComponent(userId);
  const url = `${PICA_BASE}/users/${encoded}`;
  console.log('[clerk-diagnostics] Retrieving user:', userId);
  
  const res = await fetch(url, { 
    method: "GET", 
    headers: commonHeaders(ACTION_RETRIEVE_USER) 
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error('[clerk-diagnostics] Retrieve user failed:', res.status, text);
    throw new Error(`Retrieve user failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

async function disableUserMfa(userId: string) {
  const encoded = encodeURIComponent(userId);
  const url = `${PICA_BASE}/users/${encoded}/mfa`;
  console.log('[clerk-diagnostics] Disabling MFA for user:', userId);
  
  const res = await fetch(url, { 
    method: "DELETE", 
    headers: commonHeaders(ACTION_DISABLE_USER_MFA) 
  });
  
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = text; }
  
  console.log('[clerk-diagnostics] Disable MFA result:', res.status);
  return { status: res.status, ok: res.ok, body: json };
}

interface DiagnosticRequest {
  action: 'verify_connection' | 'diagnose_user' | 'disable_user_mfa';
  email?: string;
  user_id?: string;
  perform_disable?: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // Validate environment variables
    const picaSecret = Deno.env.get('PICA_SECRET_KEY');
    const picaConn = Deno.env.get('PICA_CLERK_CONNECTION_KEY');
    
    if (!picaSecret || !picaConn) {
      console.error('[clerk-diagnostics] Missing PICA environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'configuration_error', 
          message: 'Server is not properly configured. Missing PICA credentials.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const json: DiagnosticRequest = await req.json();
    console.log('[clerk-diagnostics] Request:', json.action, 'email:', json.email, 'user_id:', json.user_id);

    const result: any = {
      connection: null,
      list_users: null,
      retrieve_user: null,
      mfa_diagnosis: null,
      disable_mfa_result: null,
      notes: []
    };

    // Step 1: Always verify connection first
    result.connection = await verifyConnection();
    
    if (!result.connection.ok) {
      result.notes.push('❌ Pica connection to Clerk failed. Check PICA_CLERK_CONNECTION_KEY.');
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    result.notes.push('✅ Pica connection to Clerk is working.');

    if (json.action === 'verify_connection') {
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Step 2: Find user by email or use provided user_id
    let userId = json.user_id;
    
    if (json.email && !userId) {
      try {
        const users = await listUsers(json.email);
        result.list_users = { 
          count: users.length, 
          users: users.map((u: any) => ({ 
            id: u.id, 
            email: u.email_addresses?.[0]?.email_address,
            two_factor_enabled: u.two_factor_enabled,
            totp_enabled: u.totp_enabled 
          })) 
        };
        
        if (users.length === 0) {
          result.notes.push(`❌ No user found with email: ${json.email}`);
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        userId = users[0].id;
        result.notes.push(`✅ Found user with email ${json.email}: ${userId}`);
      } catch (e) {
        result.notes.push(`❌ Error listing users: ${e}`);
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    if (!userId) {
      result.notes.push('❌ No user_id provided and no email to search.');
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 3: Retrieve full user details
    try {
      const user = await retrieveUser(userId);
      result.retrieve_user = {
        id: user.id,
        email: user.email_addresses?.[0]?.email_address,
        first_name: user.first_name,
        last_name: user.last_name,
        two_factor_enabled: user.two_factor_enabled,
        totp_enabled: user.totp_enabled,
        backup_code_enabled: user.backup_code_enabled,
        mfa_enabled_at: user.mfa_enabled_at,
        mfa_disabled_at: user.mfa_disabled_at,
        phone_numbers: user.phone_numbers?.map((p: any) => ({
          id: p.id,
          phone_number: p.phone_number,
          reserved_for_second_factor: p.reserved_for_second_factor,
          default_second_factor: p.default_second_factor,
          has_backup_codes: (p.backup_codes?.length || 0) > 0
        })),
        passkeys_count: user.passkeys?.length || 0,
        password_enabled: user.password_enabled
      };

      // MFA Diagnosis
      result.mfa_diagnosis = {
        has_mfa: user.two_factor_enabled || user.totp_enabled || user.backup_code_enabled,
        totp_enrolled: user.totp_enabled === true,
        backup_codes_enrolled: user.backup_code_enabled === true,
        phone_second_factors: user.phone_numbers?.filter((p: any) => p.reserved_for_second_factor).length || 0,
        passkeys_enrolled: user.passkeys?.length || 0
      };

      if (result.mfa_diagnosis.has_mfa) {
        result.notes.push('⚠️ User HAS MFA enabled despite dashboard setting:');
        if (result.mfa_diagnosis.totp_enrolled) result.notes.push('  - TOTP (authenticator app) is enrolled');
        if (result.mfa_diagnosis.backup_codes_enrolled) result.notes.push('  - Backup codes are enabled');
        if (result.mfa_diagnosis.phone_second_factors > 0) result.notes.push(`  - ${result.mfa_diagnosis.phone_second_factors} phone(s) reserved for 2FA`);
        if (result.mfa_diagnosis.passkeys_enrolled > 0) result.notes.push(`  - ${result.mfa_diagnosis.passkeys_enrolled} passkey(s) enrolled`);
        result.notes.push('🔧 You can disable MFA by calling this endpoint with action: "disable_user_mfa"');
      } else {
        result.notes.push('✅ User does NOT have MFA enrolled. The needs_second_factor status may be from:');
        result.notes.push('  - Clerk organization-level MFA policy');
        result.notes.push('  - Application-level MFA settings');
        result.notes.push('  - Stale session state (try clearing cookies/localStorage)');
      }
    } catch (e) {
      result.notes.push(`❌ Error retrieving user: ${e}`);
    }

    // Step 4: Optionally disable MFA
    if (json.action === 'disable_user_mfa' && json.perform_disable === true && userId) {
      result.notes.push('🔄 Attempting to disable MFA...');
      try {
        const disableResult = await disableUserMfa(userId);
        result.disable_mfa_result = disableResult;
        
        if (disableResult.ok) {
          result.notes.push('✅ MFA has been disabled for this user. Please try signing in again.');
          
          // Re-fetch user to confirm
          const updatedUser = await retrieveUser(userId);
          result.notes.push(`📋 Verification: two_factor_enabled=${updatedUser.two_factor_enabled}, totp_enabled=${updatedUser.totp_enabled}`);
        } else {
          result.notes.push(`❌ Failed to disable MFA: ${JSON.stringify(disableResult.body)}`);
        }
      } catch (e) {
        result.notes.push(`❌ Error disabling MFA: ${e}`);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('[clerk-diagnostics] Unexpected error:', err);
    return new Response(
      JSON.stringify({ 
        error: 'unexpected_error', 
        message: String(err) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
