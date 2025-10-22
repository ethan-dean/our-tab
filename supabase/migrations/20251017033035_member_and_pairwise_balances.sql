-- supabase/migrations/20251022100000_member_and_pairwise_balances.sql

-- Create a view to join group members with their profile and auth information.
CREATE OR REPLACE VIEW public.group_member_details AS
SELECT
  gm.group_id,
  p.id AS user_id,
  p.first_name,
  p.last_name,
  p.payment_info,
  u.email
FROM
  public.group_members AS gm
JOIN
  public.profiles AS p ON gm.user_id = p.id
JOIN
  auth.users AS u ON p.id = u.id;

-- This migration updates the group_balances view to correctly calculate balances.
-- The original view only included posts with status = 'active'.
-- This new version includes posts with status = 'active' OR status = 'pending_confirmation',
-- which ensures that pending settlements are immediately reflected in the balances.

DROP VIEW IF EXISTS public.group_balances;

CREATE OR REPLACE VIEW public.group_balances AS
WITH user_payments AS (
  SELECT
    p.payer_id AS user_id,
    p.group_id,
    SUM(p.total_amount) AS total_paid
  FROM public.posts p
  WHERE p.status IN ('active', 'pending_confirmation')
  GROUP BY p.payer_id, p.group_id
),
user_debts AS (
  SELECT
    ps.ower_id AS user_id,
    p.group_id,
    SUM(ps.amount) AS total_owed
  FROM public.post_splits ps
  JOIN public.posts p ON ps.post_id = p.id
  WHERE p.status IN ('active', 'pending_confirmation')
  GROUP BY ps.ower_id, p.group_id
)
SELECT
  gm.group_id,
  gm.user_id,
  (COALESCE(up.total_paid, 0) - COALESCE(ud.total_owed, 0)) AS net_balance
FROM public.group_members gm
LEFT JOIN user_payments up ON gm.user_id = up.user_id AND gm.group_id = up.group_id
LEFT JOIN user_debts ud ON gm.user_id = ud.user_id AND gm.group_id = ud.group_id
WHERE gm.status = 'active';


-- This migration updates the get_pairwise_balances_for_user function to correctly calculate balances.
-- The original function only included posts with status = 'active'.
-- This new version includes posts with status = 'active' OR status = 'pending_confirmation',
-- which ensures that pending settlements are immediately reflected in the pairwise balances.

CREATE OR REPLACE FUNCTION public.get_pairwise_balances_for_user(p_group_id uuid, p_user_id uuid)
RETURNS TABLE(user_id uuid, first_name text, last_name text, balance numeric)
LANGUAGE sql
STABLE
AS $$
  WITH user_to_user_debts AS (
    -- This CTE calculates the total amount each user owes to every other user in the group.
    -- It aggregates all splits from active posts (both expenses and settlements).
    SELECT
      p.payer_id AS creditor_id,
      ps.ower_id AS debtor_id,
      SUM(ps.amount) AS amount
    FROM public.posts p
    JOIN public.post_splits ps ON p.id = ps.post_id
    WHERE p.group_id = p_group_id
      AND p.status IN ('active', 'pending_confirmation')
      AND p.payer_id != ps.ower_id -- Don't count paying for oneself
    GROUP BY p.payer_id, ps.ower_id
  )
  -- Now, calculate the net balance for the requesting user (p_user_id) against every other member.
  SELECT
    gm.user_id,
    pr.first_name,
    pr.last_name,
    -- (Amount they owe me) - (Amount I owe them)
    COALESCE(they_owe_me.amount, 0) - COALESCE(i_owe_them.amount, 0) AS balance
  FROM public.group_members gm
  JOIN public.profiles pr ON gm.user_id = pr.id
  -- Join to get debts where the other member is the debtor and I am the creditor.
  LEFT JOIN user_to_user_debts AS they_owe_me
    ON they_owe_me.debtor_id = gm.user_id AND they_owe_me.creditor_id = p_user_id
  -- Join to get debts where I am the debtor and the other member is the creditor.
  LEFT JOIN user_to_user_debts AS i_owe_them
    ON i_owe_them.debtor_id = p_user_id AND i_owe_them.creditor_id = gm.user_id
  WHERE gm.group_id = p_group_id
    AND gm.user_id != p_user_id
    AND gm.status = 'active';
$$;
