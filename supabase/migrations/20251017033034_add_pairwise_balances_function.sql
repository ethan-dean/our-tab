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
      AND p.status = 'active'
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