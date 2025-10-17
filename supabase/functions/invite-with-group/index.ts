import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { invitee_email, groupId } = await req.json();
    if (!invitee_email || !groupId) {
      throw new Error('Missing required fields: invitee_email and groupId');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Check if user exists by calling the RPC function.
    let { data: userId, error: rpcError } = await supabaseAdmin
      .rpc('get_user_id_by_email', { p_email: invitee_email })
      .single();

    if (rpcError && rpcError.code !== 'PGRST116') { // PGRST116 means no rows found, which is expected for a new user.
      throw rpcError;
    }

    let responseMessage = '';

    if (userId) {
      // --- EXISTING USER FLOW ---
      responseMessage = "User already exists. In-app notification sent.";
    } else {
      // --- NEW USER FLOW ---
      const redirectTo = `${Deno.env.get('SITE_URL')}/accept-invite?group_id=${groupId}`;
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        invitee_email,
        { redirectTo: redirectTo }
      );

      if (inviteError) throw inviteError;
      userId = inviteData.user.id; // Get the ID of the newly created user.
      responseMessage = "Invitation email sent to new user.";
    }

    // --- COMMON LOGIC: Create Notification for BOTH flows ---
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: inviter } } = await supabaseClient.auth.getUser();
    if (!inviter) throw new Error("Could not identify the user sending the invite.");

    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        triggering_user_id: inviter.id,
        group_id: groupId,
        type: 'group_invite',
      });

    if (notificationError) throw notificationError;

    return new Response(JSON.stringify({ message: responseMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});