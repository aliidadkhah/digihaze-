-- =====================================================
-- rewrite-image-urls.sql — عوض کردن آدرس عکس‌ها از Supabase به خود سایت
--
-- آدرس‌های   https://okaocbpofqnyzapqdcpu.supabase.co/storage/v1/object/public/...
-- رو توی همه‌ی ستون‌های متنی / jsonb / آرایه‌ی متنی پیدا می‌کنه و به
--            https://digihaze.ir/uploads/...
-- تبدیل می‌کنه.
--
-- ۱) فقط شمارش (چیزی عوض نمی‌شه):
--    sudo -u postgres psql -d digihaze -v ON_ERROR_STOP=1 -v apply=false < scripts/migration/rewrite-image-urls.sql
-- ۲) اعمال تغییر (همه‌چیز توی یک تراکنش):
--    sudo -u postgres psql -d digihaze -v ON_ERROR_STOP=1 -v apply=true  < scripts/migration/rewrite-image-urls.sql
-- =====================================================
\set ON_ERROR_STOP on

begin;

\if :apply
  -- تریگر updated_at دست نخوره (بازنویسی آدرس «ویرایش محصول» حساب نمی‌شه)
  set local session_replication_role = replica;
\endif

create or replace function pg_temp.dh_rewrite(do_apply boolean)
returns table(tbl text, col text, rows_matched bigint)
language plpgsql as $f$
declare
  r record;
  n bigint;
  old_prefix constant text := 'https://okaocbpofqnyzapqdcpu.supabase.co/storage/v1/object/public/';
  new_prefix constant text := 'https://digihaze.ir/uploads/';
begin
  for r in
    select c.table_name::text as t, c.column_name::text as c, c.udt_name::text as u
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema = c.table_schema and tb.table_name = c.table_name
    where c.table_schema = 'public'
      and tb.table_type = 'BASE TABLE'
      and c.udt_name in ('text', 'varchar', 'jsonb', 'json', '_text', '_varchar')
    order by 1, 2
  loop
    execute format('select count(*) from public.%I where %I::text like %L',
                   r.t, r.c, '%' || old_prefix || '%')
      into n;

    if n > 0 then
      tbl := r.t; col := r.c; rows_matched := n;
      return next;

      if do_apply then
        if r.u in ('text', 'varchar') then
          execute format('update public.%I set %I = replace(%I, %L, %L) where %I like %L',
                         r.t, r.c, r.c, old_prefix, new_prefix, r.c, '%' || old_prefix || '%');
        elsif r.u in ('jsonb', 'json') then
          execute format('update public.%I set %I = replace(%I::text, %L, %L)::%s where %I::text like %L',
                         r.t, r.c, r.c, old_prefix, new_prefix, r.u, r.c, '%' || old_prefix || '%');
        else
          execute format('update public.%I set %I = replace(%I::text, %L, %L)::%s where %I::text like %L',
                         r.t, r.c, r.c, old_prefix, new_prefix,
                         case r.u when '_varchar' then 'varchar[]' else 'text[]' end,
                         r.c, '%' || old_prefix || '%');
        end if;
      end if;
    end if;
  end loop;
end;
$f$;

select * from pg_temp.dh_rewrite(:apply);

-- بعد از اعمال: چیزی با آدرس Supabase مونده؟ (باید ۰ ردیف باشه)
select 'باقی‌مانده' as check, tbl, col, rows_matched
from pg_temp.dh_rewrite(false);

commit;
