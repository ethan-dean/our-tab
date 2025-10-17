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

    // 1. Check if user exists by calling the new RPC function.
    const { data: existingUserId, error: rpcError } = await supabaseAdmin
      .rpc('get_user_id_by_email', { p_email: invitee_email })
      .single();

    // rpcError with code PGRST116 means no rows were found, which is expected for a new user.
    if (rpcError && rpcError.code !== 'PGRST116') {
      throw rpcError;
    }

    if (existingUserId) {
      // --- EXISTING USER FLOW: Create an in-app notification ---
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
          user_id: existingUserId,
          triggering_user_id: inviter.id,
          group_id: groupId,
          type: 'group_invite',
        });

      if (notificationError) throw notificationError;

      return new Response(JSON.stringify({ message: "User already exists. In-app notification sent." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      // --- NEW USER FLOW: Send an invitation email ---
      const redirectTo = `${Deno.env.get('SITE_URL')}/accept-invite?group_id=${groupId}`;
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        invitee_email,
        { redirectTo: redirectTo }
      );

      if (inviteError) throw inviteError;

      return new Response(JSON.stringify({ message: "Invitation email sent to new user." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
