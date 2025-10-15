import { supabase } from './supabaseClient';
import { SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { Profile } from '../types/database';

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
    const { data, error } = await supabase.rpc('create_group', { p_name: name });
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

export const createPost = async (postData: any) => {
    const { data, error } = await supabase.rpc('create_post', postData);
    if (error) throw error;
    return data;
};

export const editPost = async (postData: any) => {
    const { data, error } = await supabase.rpc('edit_post', postData);
    if (error) throw error;
    return data;
};

// --- Settlement API ---

export const createSettlement = async (settlementData: any) => {
    const { data, error } = await supabase.rpc('create_settlement', settlementData);
    if (error) throw error;
    return data;
};

export const resolveSettlement = async (postId: string, action: 'confirm' | 'deny') => {
    const { data, error } = await supabase.rpc('resolve_settlement', { p_post_id: postId, p_action: action });
    if (error) throw error;
    return data;
};

export const simplifyDebts = async (groupId: string) => {
    const { data, error } = await supabase.rpc('simplify_group_debts', { p_group_id: groupId });
    if (error) throw error;
    return data;
};
