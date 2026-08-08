-- Tasky V5: secure invite acceptance
-- Run once in Supabase SQL Editor.

begin;

create or replace function public.accept_my_pending_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_count integer := 0;
begin
  if v_user_id is null or v_email = '' then
    return 0;
  end if;

  update public.workspace_members
  set
    user_id = v_user_id,
    status = 'active',
    joined_at = coalesce(joined_at, now())
  where status = 'invited'
    and lower(trim(invited_email)) = v_email
    and (user_id is null or user_id = v_user_id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.accept_my_pending_invites() from public;
grant execute on function public.accept_my_pending_invites() to authenticated;

commit;
