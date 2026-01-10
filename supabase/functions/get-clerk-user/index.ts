// Edge Function to retrieve Clerk user via Pica Passthrough
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // Connection verification (MUST)
    const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
    const PICA_CLERK_CONNECTION_KEY = Deno.env.get("PICA_CLERK_CONNECTION_KEY");
    
    if (!PICA_SECRET_KEY || !PICA_CLERK_CONNECTION_KEY) {
      console.error("[get-clerk-user] Missing Pica environment variables");
      return new Response(
        JSON.stringify({
          error: "Missing Pica connection; set PICA_SECRET_KEY and PICA_CLERK_CONNECTION_KEY"
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse incoming request to extract user_id
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    
    // Try to extract userId from: 1. request body (POST), 2. query param, 3. path segment
    let userId: string | null = null;
    
    // First, try to get from request body (for POST requests from supabase.functions.invoke)
    if (req.method === "POST") {
      try {
        const body = await req.json();
        userId = body?.user_id || null;
        console.log("[get-clerk-user] Got user_id from body:", userId);
      } catch (e) {
        console.log("[get-clerk-user] No valid JSON body");
      }
    }
    
    // Fallback to query parameter
    if (!userId) {
      userId = url.searchParams.get("user_id");
      if (userId) {
        console.log("[get-clerk-user] Got user_id from query param:", userId);
      }
    }
    
    // Fallback to path segment
    if (!userId) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment !== "get-clerk-user") {
        userId = lastSegment;
        console.log("[get-clerk-user] Got user_id from path:", userId);
      }
    }
    
    if (!userId) {
      console.error("[get-clerk-user] Missing user_id parameter");
      return new Response(
        JSON.stringify({ error: "Missing user_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Build Pica Passthrough URL (substitute path variable)
    const passthroughUrl = `https://api.picaos.com/v1/passthrough/users/${encodeURIComponent(userId)}`;
    console.log("[get-clerk-user] Calling Pica passthrough:", passthroughUrl);

    // Required headers for Pica Passthrough
    const headers: Record<string, string> = {
      "x-pica-secret": PICA_SECRET_KEY,
      "x-pica-connection-key": PICA_CLERK_CONNECTION_KEY,
      "x-pica-action-id": "conn_mod_def::GCT_31Q-7fo::pym2V-IETdaZ-7BJwSQTSA",
      "Accept": "application/json"
    };

    const resp = await fetch(passthroughUrl, { method: "GET", headers });
    console.log("[get-clerk-user] Pica response status:", resp.status);

    // Forward status & body
    const contentType = resp.headers.get("content-type") || "application/json";
    const body = await resp.text();
    console.log("[get-clerk-user] Response body:", body.substring(0, 200));
    
    // If the response is an error, log it but still return the user object from Clerk directly
    // This is a fallback to handle cases where Pica might not have the user cached
    if (resp.status !== 200) {
      console.error("[get-clerk-user] Pica returned non-200:", resp.status, body);
      // Return a graceful fallback - the app will use local Clerk data
      return new Response(
        JSON.stringify({ 
          error: "Could not fetch extended user details",
          status: resp.status,
          fallback: true
        }),
        {
          status: 200, // Return 200 so the app doesn't crash, just with fallback data
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    return new Response(body, {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": contentType }
    });

  } catch (err: any) {
    console.error("[get-clerk-user] Error:", err?.message ?? err);
    return new Response(
      JSON.stringify({ 
        error: err?.message ?? "unknown_error",
        fallback: true 
      }),
      {
        status: 200, // Return 200 with fallback flag so app doesn't crash
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
