DROP VIEW public.group_balances;

CREATE VIEW public.group_balances AS
WITH user_payments AS (
  SELECT
    p.payer_id AS user_id,
    p.group_id,
    SUM(p.total_amount) AS total_paid
  FROM public.posts p
  WHERE p.status = 'active'
  GROUP BY p.payer_id, p.group_id
),
user_debts AS (
  SELECT
    ps.ower_id AS user_id,
    p.group_id,
    SUM(ps.amount) AS total_owed
  FROM public.post_splits ps
  JOIN public.posts p ON ps.post_id = p.id
  WHERE p.status = 'active'
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
