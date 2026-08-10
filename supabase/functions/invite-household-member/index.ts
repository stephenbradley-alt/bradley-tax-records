import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "https://bradley-tax-records.vercel.app",
  "Content-Type": "application/json",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response(JSON.stringify({ message: "Method not allowed" }), { status: 405, headers: corsHeaders });

  const authorization = request.headers.get("Authorization");
  if (!authorization) return new Response(JSON.stringify({ message: "You must be signed in" }), { status: 401, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const callerClient = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } } });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) return new Response(JSON.stringify({ message: "Your session has expired. Please sign in again." }), { status: 401, headers: corsHeaders });

  const { email } = await request.json();
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return new Response(JSON.stringify({ message: "Enter a valid email address." }), { status: 400, headers: corsHeaders });

  const { data: ownerMembership } = await adminClient.from("household_members").select("household_id, role").eq("user_id", user.id).eq("role", "owner").maybeSingle();
  if (!ownerMembership) return new Response(JSON.stringify({ message: "Only the household owner can invite users." }), { status: 403, headers: corsHeaders });

  const { data: invitation, error: invitationError } = await adminClient.auth.admin.inviteUserByEmail(cleanEmail, { redirectTo: "https://bradley-tax-records.vercel.app" });
  if (invitationError || !invitation.user) return new Response(JSON.stringify({ message: invitationError?.message ?? "Could not send the invitation." }), { status: 400, headers: corsHeaders });

  const { error: membershipError } = await adminClient.from("household_members").upsert({ household_id: ownerMembership.household_id, user_id: invitation.user.id, role: "member" }, { onConflict: "household_id,user_id" });
  if (membershipError) return new Response(JSON.stringify({ message: "Invitation was sent but household access could not be added." }), { status: 500, headers: corsHeaders });
  return new Response(JSON.stringify({ message: `Invitation sent to ${cleanEmail}.` }), { status: 200, headers: corsHeaders });
});
