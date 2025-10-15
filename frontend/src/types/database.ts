export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type GroupRole = "admin" | "member";
export type InviteStatus = "pending" | "accepted" | "declined";
export type MemberStatus = "active" | "inactive";
export type NotificationType = | "new_expense" | "expense_edited" | "settlement_request" | "settlement_confirmed";
export type PostStatus = | "active" | "pending_amount" | "pending_confirmation" | "invalid";
export type PostType = "expense" | "settlement" | "simplification_event";

export interface Profile {
  id: string; // UUID
  first_name: string | null;
  last_name: string | null;
  payment_info: Json | null;
  updated_at: string; // timestamptz
  created_at: string; // timestamptz
}

export interface Group {
  id: string; // UUID
  name: string;
  created_by: string | null; // UUID
  created_at: string; // timestamptz
}

export interface GroupMember {
  group_id: string; // UUID
  user_id: string; // UUID
  role: GroupRole;
  status: MemberStatus;
  joined_at: string; // timestamptz
  left_at: string | null; // timestamptz
}

export interface Invite {
  id: string; // UUID
  group_id: string; // UUID
  inviter_id: string; // UUID
  invitee_email: string;
  status: InviteStatus;
  created_at: string; // timestamptz
}

export interface Post {
  id: string; // UUID
  group_id: string; // UUID
  author_id: string; // UUID
  type: PostType;
  title: string | null;
  total_amount: number | null;
  payer_id: string; // UUID
  image_url: string | null;
  status: PostStatus;
  created_at: string; // timestamptz
  metadata: Json | null;
}

export interface PostSplit {
  id: string; // UUID
  post_id: string; // UUID
  ower_id: string; // UUID
  amount: number;
}

export interface PostHistory {
  id: number; // BIGINT
  post_id: string; // UUID
  editor_id: string; // UUID
  changes: Json;
  created_at: string; // timestamptz
}

export interface Notification {
  id: number; // BIGINT
  user_id: string; // UUID
  triggering_user_id: string; // UUID
  post_id: string; // UUID
  type: NotificationType;
  is_read: boolean;
  created_at: string; // timestamptz
}
