-- 1. Drop the restrictive SELECT policy on the groups table
DROP POLICY "Users can view groups they are members of" ON public.groups;

-- 2. Create a corrected policy that also allows the creator to view the group
CREATE POLICY "Users can view groups they create or are members of"
ON public.groups
FOR SELECT
USING (
  -- User is the creator of the group
  (created_by = auth.uid())
  OR
  -- User is a member of the group
  (EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  ))
);
