-- 1. Drop the recursive SELECT policy on group_members
DROP POLICY "Users can view memberships of groups they belong to" ON public.group_members;

-- 2. Create a corrected, non-recursive policy for SELECT
-- This allows a user to see their OWN membership records, which is sufficient for the `getUserGroups` query.
-- The ability to see other members of a group is implicitly handled by the fact that the query for group details
-- is authorized by the user being a member of that group first.
CREATE POLICY "Users can view their own membership records"
ON public.group_members
FOR SELECT
USING (user_id = auth.uid());
