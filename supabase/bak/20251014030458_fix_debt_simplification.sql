-- 1. Add metadata column to posts table to store simplification details
ALTER TABLE public.posts
ADD COLUMN metadata JSONB NULL;

-- 2. Correct the simplify_group_debts function to use the new column
CREATE OR REPLACE FUNCTION public.simplify_group_debts(p_group_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    debtors RECORD;
    creditors RECORD;
    payment_amount NUMERIC;
    new_post_id UUID;
    simplified_payments JSONB := '[]'::JSONB;
BEGIN
    -- Verify the user is an admin of the group
    IF (public.get_user_role_in_group(p_group_id, auth.uid()) != 'admin') THEN
        RAISE EXCEPTION 'Only group admins can simplify debts.';
    END IF;

    -- Use temporary tables to hold debtors and creditors
    CREATE TEMP TABLE temp_debtors AS
    SELECT u.id as user_id, p.first_name, p.last_name, gb.net_balance
    FROM public.group_balances gb
    JOIN public.profiles p ON gb.user_id = p.id
    JOIN auth.users u ON p.id = u.id
    WHERE gb.group_id = p_group_id AND gb.net_balance < 0
    ORDER BY gb.net_balance ASC;

    CREATE TEMP TABLE temp_creditors AS
    SELECT u.id as user_id, p.first_name, p.last_name, gb.net_balance
    FROM public.group_balances gb
    JOIN public.profiles p ON gb.user_id = p.id
    JOIN auth.users u ON p.id = u.id
    WHERE gb.group_id = p_group_id AND gb.net_balance > 0
    ORDER BY gb.net_balance DESC;

    -- Loop until all debts are settled
    WHILE (SELECT COUNT(*) FROM temp_debtors) > 0 AND (SELECT COUNT(*) FROM temp_creditors) > 0 LOOP
        -- Get the largest debtor and creditor
        SELECT * INTO debtors FROM temp_debtors LIMIT 1;
        SELECT * INTO creditors FROM temp_creditors LIMIT 1;

        payment_amount := LEAST(abs(debtors.net_balance), creditors.net_balance);

        -- Create an auto-confirmed settlement post for this simplified payment
        INSERT INTO public.posts (group_id, author_id, type, title, total_amount, payer_id, status)
        VALUES (p_group_id, auth.uid(), 'settlement', 'Simplified Settlement', payment_amount, debtors.user_id, 'active')
        RETURNING id INTO new_post_id;

        INSERT INTO public.post_splits (post_id, ower_id, amount)
        VALUES (new_post_id, creditors.user_id, payment_amount);

        -- Add this transaction to our JSONB array for the final summary post
        simplified_payments := simplified_payments || jsonb_build_object(
            'from_user', debtors.first_name || ' ' || debtors.last_name,
            'to_user', creditors.first_name || ' ' || creditors.last_name,
            'amount', payment_amount
        );

        -- Update balances in temp tables
        UPDATE temp_debtors SET net_balance = net_balance + payment_amount WHERE user_id = debtors.user_id;
        UPDATE temp_creditors SET net_balance = net_balance - payment_amount WHERE user_id = creditors.user_id;

        -- Remove settled users
        DELETE FROM temp_debtors WHERE net_balance >= -0.001;
        DELETE FROM temp_creditors WHERE net_balance <= 0.001;
    END LOOP;

    -- Create a summary post for the event with the list of transactions
    INSERT INTO public.posts (group_id, author_id, type, title, status, metadata)
    VALUES (p_group_id, auth.uid(), 'simplification_event', 'Debts have been simplified', 'active', simplified_payments);

    DROP TABLE temp_debtors;
    DROP TABLE temp_creditors;
END;
$function$;
