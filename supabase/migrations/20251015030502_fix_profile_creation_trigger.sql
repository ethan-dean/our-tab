-- Description: Corrects the keys used to extract user metadata during profile creation.
-- This fixes a bug where first_name and last_name were not being populated in the public.profiles table upon user sign-up.

CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name', -- Corrected from camelCase to snake_case
        NEW.raw_user_meta_data->>'last_name'  -- Corrected from camelCase to snake_case
    );
    RETURN NEW;
END;
$function$;
