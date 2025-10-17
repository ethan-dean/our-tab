import { supabase } from './supabaseClient';
import { type SignInWithPasswordCredentials, type SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { type Profile } from '../types/database';

// --- Auth API ---

export const signInWithPassword = async (credentials: SignInWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data;
};

export const signUpNewUser = async (credentials: SignUpWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/update-password',
  });
  if (error) throw error;
};

export const updateUserPassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
};

// --- Profile API ---

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  // If name is being updated, also update the auth user metadata
  if (updates.first_name || updates.last_name) {
    const { error: authError } = await supabase.auth.updateUser({
        data: { first_name: updates.first_name, last_name: updates.last_name }
    });
    if (authError) throw authError;
  }

  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data as Profile;
};

// --- Group API ---

export const getUserGroups = async (userId: string) => {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, groups(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};

export const getGroupDetails = async (groupId: string) => {
    const { data, error } = await supabase.from('groups').select('*, group_members(*, profiles(*))').eq('id', groupId).single();
    if (error) throw error;
    return data;
};

export const createGroup = async (name: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError || new Error('User not found.');

    // 1. Create the group
    const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({ name: name, created_by: user.id })
        .select()
        .single();

    if (groupError) throw groupError;
    if (!groupData) throw new Error('Failed to create group.');

    // 2. Add the creator as an admin member
    const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: groupData.id, user_id: user.id, role: 'admin' });

    if (memberError) {
        // Attempt to clean up the created group if the second step fails
        await supabase.from('groups').delete().eq('id', groupData.id);
        throw memberError;
    }

    return groupData;
};

export const createInvite = async (groupId: string, inviteeEmail: string) => {
    const { data, error } = await supabase.functions.invoke('invite-with-group', {
        body: { 
            groupId: groupId,
            invitee_email: inviteeEmail 
        },
    });
    if (error) throw error;
    return data;
};

// --- Post & Expense API ---

export const getGroupPosts = async (groupId: string) => {
    const { data, error } = await supabase.from('posts').select('*, author:profiles!author_id(*), payer:profiles!payer_id(*), post_splits(*, owers:profiles(*))').eq('group_id', groupId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const getPostDetails = async (postId: string) => {
    const { data, error } = await supabase.from('posts').select('*, author:profiles!author_id(*), payer:profiles!payer_id(*), post_splits(*, owers:profiles(*))').eq('id', postId).single();
    if (error) throw error;
    return data;
};

export const getPostHistory = async (postId: string) => {
    const { data, error } = await supabase.from('post_history').select('*, editor:profiles(*)').eq('post_id', postId).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
};

export const createPost = async (postPayload: any) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError || new Error('User not found.');

    const { splits, ...post } = postPayload;

    // 1. Create the main post record
    const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
            ...post,
            author_id: user.id,
            type: 'expense', // This function is specifically for creating expenses
            status: 'active',
        })
        .select()
        .single();

    if (postError) throw postError;
    if (!postData) throw new Error('Failed to create post.');

    // 2. Create the split records
    const splitData = splits.map((split: any) => ({
        post_id: postData.id,
        ...split,
    }));

    const { error: splitError } = await supabase.from('post_splits').insert(splitData);

    if (splitError) {
        // Attempt to clean up the created post if splits fail
        await supabase.from('posts').delete().eq('id', postData.id);
        throw splitError;
    }

    // 3. Create the initial history record
    const { error: historyError } = await supabase.from('post_history').insert({
        post_id: postData.id,
        editor_id: user.id,
        changes: { action: 'create' }, // Simplified history for now
    });

    if (historyError) {
        // This is non-critical, so we'll just log it for now and not roll back the whole post
        console.error('Failed to create post history:', historyError);
    }

    return postData;
};

export const editPost = async (payload: any) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError || new Error('User not found.');

    const { postId, splits, ...postUpdateData } = payload;

    // 1. Update the main post record
    const { data: postData, error: postError } = await supabase
        .from('posts')
        .update(postUpdateData)
        .eq('id', postId)
        .select()
        .single();

    if (postError) throw postError;
    if (!postData) throw new Error('Failed to update post.');

    // 2. Delete old splits
    const { error: deleteError } = await supabase.from('post_splits').delete().eq('post_id', postId);
    if (deleteError) throw deleteError;

    // 3. Insert new splits
    const newSplitData = splits.map((split: any) => ({
        post_id: postId,
        ...split,
    }));
    const { error: splitError } = await supabase.from('post_splits').insert(newSplitData);
    if (splitError) throw splitError; // In a real app, you might want to roll back the post update here.

    // 4. Create a history record for the edit
    const { error: historyError } = await supabase.from('post_history').insert({
        post_id: postId,
        editor_id: user.id,
        changes: { action: 'edit' }, // Simplified diff for now
    });
    if (historyError) {
        console.error('Failed to create post history for edit:', historyError);
    }

    return postData;
};

// --- Settlement API ---

export const createSettlement = async (groupId: string, recipientId: string, amount: number) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError || new Error('User not found.');

    // Create the main post record for the settlement
    const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
            group_id: groupId,
            author_id: user.id,
            payer_id: user.id, // The sender is the payer
            type: 'settlement',
            title: 'Settlement', // Settlements don't have a user-defined title
            total_amount: amount,
            status: 'pending_confirmation',
        })
        .select()
        .single();

    if (postError) throw postError;
    if (!postData) throw new Error('Failed to create settlement post.');

    // Create the split record for the settlement
    const { error: splitError } = await supabase
        .from('post_splits')
        .insert({
            post_id: postData.id,
            ower_id: recipientId, // The recipient is the "ower" of this credit
            amount: amount,
        });
    
    if (splitError) {
        // Attempt to clean up the created post if the split fails
        await supabase.from('posts').delete().eq('id', postData.id);
        throw splitError;
    }

    return postData;
};

export const resolveSettlement = async (postId: string, action: 'confirm' | 'deny') => {
    const newStatus = action === 'confirm' ? 'active' : 'invalid';

    const { data, error } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', postId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const simplifyDebts = async (groupId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError || new Error('User not found.');

    // 1. Fetch balances and profile data
    const { data: balances, error: balanceError } = await supabase
        .from('group_balances')
        .select('net_balance, profiles!group_members_user_id_fkey(id, first_name, last_name)')
        .eq('group_id', groupId);

    if (balanceError) throw balanceError;

    // 2. Implement the greedy algorithm
    const debtors = balances.filter((b: any) => b.net_balance < 0).sort((a: any, b: any) => a.net_balance - b.net_balance);
    const creditors = balances.filter((b: any) => b.net_balance > 0).sort((a: any, b: any) => b.net_balance - a.net_balance);
    
    const simplifiedPayments: any[] = [];
    const settlementPosts: any[] = [];

    while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        const paymentAmount = Math.min(Math.abs(debtor.net_balance), creditor.net_balance);

        if (paymentAmount < 0.01) {
            debtors.shift();
            creditors.shift();
            continue;
        }

        settlementPosts.push({
            group_id: groupId,
            author_id: user.id,
            payer_id: debtor.profiles.id, // Debtor pays the creditor
            type: 'settlement',
            title: 'Simplified Settlement',
            total_amount: paymentAmount,
            status: 'active', // These are auto-confirmed
        });

        simplifiedPayments.push({
            from_user: `${debtor.profiles.first_name} ${debtor.profiles.last_name}`,
            to_user: `${creditor.profiles.first_name} ${creditor.profiles.last_name}`,
            amount: paymentAmount,
            payer_id: debtor.profiles.id,
            recipient_id: creditor.profiles.id,
        });

        debtor.net_balance += paymentAmount;
        creditor.net_balance -= paymentAmount;

        if (Math.abs(debtor.net_balance) < 0.01) debtors.shift();
        if (creditor.net_balance < 0.01) creditors.shift();
    }

    // 3. Create all settlement posts
    const { data: createdPosts, error: postsError } = await supabase
        .from('posts')
        .insert(settlementPosts)
        .select();

    if (postsError) throw postsError;
    if (!createdPosts) throw new Error('Failed to create settlement posts during simplification.');

    // 4. Create all post splits for the new settlements
    const settlementSplits = createdPosts.map((post, index) => {
        const payment = simplifiedPayments[index];
        return {
            post_id: post.id,
            ower_id: payment.recipient_id,
            amount: post.total_amount,
        };
    });

    const { error: splitsError } = await supabase.from('post_splits').insert(settlementSplits);
    if (splitsError) throw splitsError; // In a real app, would need to roll back posts

    // 5. Create the final summary post
    const { data: summaryPost, error: summaryError } = await supabase
        .from('posts')
        .insert({
            group_id: groupId,
            author_id: user.id,
            payer_id: user.id,
            type: 'simplification_event',
            title: 'Debts have been simplified',
            status: 'active',
            metadata: simplifiedPayments.map(({ payer_id, recipient_id, ...rest }) => rest), // Remove IDs from metadata
        })
        .select()
        .single();
    
    if (summaryError) throw summaryError;

    return summaryPost;
};

export const add_user_to_group = async (groupId: string) => {
    const { data, error } = await supabase.rpc('add_user_to_group', { p_group_id: groupId });
    if (error) throw error;
    return data;
};

// --- Notification API ---

export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};