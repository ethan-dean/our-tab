-- 1. Drop the recursive policy on group_members
DROP POLICY "Admins can manage members, and users can leave" ON public.group_members;

-- 2. Create a corrected, non-recursive policy
CREATE POLICY "Admins can manage members, and users can leave"
ON public.group_members
FOR UPDATE
USING (
  -- Check if the user is an admin in the group they are trying to modify
  (EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'::group_role
  ))
  OR
  -- Allow users to update their OWN status to leave a group
  (user_id = auth.uid())
);
