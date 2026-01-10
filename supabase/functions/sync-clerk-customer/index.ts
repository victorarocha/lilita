import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
    const PICA_CLERK_CONNECTION_KEY = Deno.env.get("PICA_CLERK_CONNECTION_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[sync-clerk-customer] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: { clerk_user_id?: string; email?: string; first_name?: string; last_name?: string; full_name?: string } = {};
    try {
      body = await req.json();
      console.log("[sync-clerk-customer] Request body:", body);
    } catch (e) {
      console.log("[sync-clerk-customer] No valid JSON body");
    }

    const { clerk_user_id, email, first_name, last_name, full_name } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Check if customer exists by email
    console.log("[sync-clerk-customer] Checking for existing customer with email:", email);
    const { data: existingCustomer, error: selectError } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error("[sync-clerk-customer] Error selecting customer:", selectError);
      return new Response(
        JSON.stringify({ error: "Database error", details: selectError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If customer exists, return it
    if (existingCustomer) {
      console.log("[sync-clerk-customer] Found existing customer:", existingCustomer.id);
      
      // Update clerk_user_id if not set
      if (!existingCustomer.clerk_user_id && clerk_user_id) {
        const { data: updatedCustomer, error: updateError } = await supabase
          .from("customers")
          .update({ clerk_user_id, updated_at: new Date().toISOString() })
          .eq("id", existingCustomer.id)
          .select()
          .single();
        
        if (!updateError && updatedCustomer) {
          return new Response(
            JSON.stringify({ data: { customer: updatedCustomer }, created: false }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ data: { customer: existingCustomer }, created: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Customer doesn't exist, create new one
    console.log("[sync-clerk-customer] Creating new customer with email:", email);
    
    // Build full_name from first_name and last_name if not provided
    const computedFullName = full_name || [first_name, last_name].filter(Boolean).join(" ") || null;

    const newCustomer = {
      clerk_user_id: clerk_user_id || null,
      email,
      full_name: computedFullName,
      first_name: first_name || null,
      last_name: last_name || null,
    };

    const { data: insertedCustomer, error: insertError } = await supabase
      .from("customers")
      .insert(newCustomer)
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation (race condition)
      if (insertError.code === "23505") {
        console.log("[sync-clerk-customer] Race condition detected, re-fetching customer");
        const { data: requeriedCustomer, error: reError } = await supabase
          .from("customers")
          .select("*")
          .eq("email", email)
          .limit(1)
          .maybeSingle();

        if (reError || !requeriedCustomer) {
          console.error("[sync-clerk-customer] Error re-querying customer:", reError);
          return new Response(
            JSON.stringify({ error: "Database error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ data: { customer: requeriedCustomer }, created: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.error("[sync-clerk-customer] Error inserting customer:", insertError);
      return new Response(
        JSON.stringify({ error: "Database error", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[sync-clerk-customer] Created new customer:", insertedCustomer.id);
    return new Response(
      JSON.stringify({ data: { customer: insertedCustomer }, created: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[sync-clerk-customer] Unhandled error:", err?.message ?? err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
