// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { email, password } = await req.json();

  // Verify against Firebase REST API
  const firebaseRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${Deno.env.get("FIREBASE_API_KEY")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    }
  );

  if (!firebaseRes.ok) {
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      { status: 401, headers: corsHeaders }
    );
  }

  // Firebase accepted — update Supabase password
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const user = users.find((u) => u.email === email);

  // Only migrate users that originally came from Firebase
  if (!user?.user_metadata?.firebase_uid) {
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      { status: 401, headers: corsHeaders }
    );
  }

  if (!user) {
    return new Response(
      JSON.stringify({ error: "User not found in Supabase" }),
      { status: 404, headers: corsHeaders }
    );
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: corsHeaders }
  );
});
