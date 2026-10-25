-- =====================================================================
-- آمار بازدید دیجی‌هیز (نسخه‌ی حرفه‌ای)
-- این فایل رو یک‌بار توی Supabase > SQL Editor اجرا کن.
-- چندبار اجرا شدنش مشکلی ایجاد نمی‌کنه و داده‌های قبلی پاک نمی‌شن.
-- =====================================================================

-- 1) جدول بازدیدها (اگه توی پروژه‌ی جدید Supabase ساخته نشده بود، ساخته می‌شه)
create table if not exists public.page_views (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  path        text not null,
  visitor_id  text not null,
  referrer    text
);

-- 2) ستون‌های جدید برای آنالیز (روی جدول قدیمی هم امنه)
alter table public.page_views
  add column if not exists session_id      text,
  add column if not exists referrer_host   text,
  add column if not exists channel         text,
  add column if not exists utm_source      text,
  add column if not exists utm_medium      text,
  add column if not exists utm_campaign    text,
  add column if not exists device          text,
  add column if not exists browser         text,
  add column if not exists os              text,
  add column if not exists country         text,
  add column if not exists is_new_visitor  boolean not null default false;

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_visitor_idx    on public.page_views (visitor_id, created_at);
create index if not exists page_views_session_idx    on public.page_views (session_id);

-- 3) فقط سرور (service_role) به این جدول دسترسی داره، نه مرورگر کاربرها
alter table public.page_views enable row level security;

-- 4) تابع اصلی گزارش (همه‌ی محاسبات توی خود دیتابیس انجام می‌شه،
--    پس محدودیت ۱۰۰۰ ردیف Supabase دیگه آمار رو خراب نمی‌کنه)
create or replace function public.analytics_overview(
  p_from      timestamptz,
  p_to        timestamptz,
  p_prev_from timestamptz,
  p_prev_to   timestamptz,
  p_gran      text default 'day'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trunc      text      := case when p_gran = 'hour' then 'hour' else 'day' end;
  v_step       interval  := case when p_gran = 'hour' then interval '1 hour' else interval '1 day' end;
  v_n          int       := least(400, greatest(1, ceil(
                              extract(epoch from (p_to - p_from)) /
                              (case when p_gran = 'hour' then 3600 else 86400 end)
                            )::int));
  v_cur_start  timestamp := date_trunc(case when p_gran = 'hour' then 'hour' else 'day' end,
                                       p_from at time zone 'Asia/Tehran');
  v_prev_start timestamp := date_trunc(case when p_gran = 'hour' then 'hour' else 'day' end,
                                       p_prev_from at time zone 'Asia/Tehran');
  v_result     jsonb;
begin
  with base as (
    select
      id,
      created_at,
      (created_at >= p_from and created_at < p_to) as is_cur,
      split_part(path, '?', 1) as page,
      visitor_id,
      coalesce(session_id,
               visitor_id || ':' || ((created_at at time zone 'Asia/Tehran')::date)::text) as sid,
      channel, referrer_host, utm_source, utm_medium, utm_campaign,
      device, browser, os, country, is_new_visitor,
      (created_at at time zone 'Asia/Tehran') as local_ts
    from public.page_views
    where (created_at >= p_from and created_at < p_to)
       or (created_at >= p_prev_from and created_at < p_prev_to)
  ),
  cur  as (select * from base where is_cur),
  prev as (select * from base where not is_cur),
  ranked as (
    select c.*,
      row_number() over (partition by sid order by created_at asc,  id asc)  as rn_first,
      row_number() over (partition by sid order by created_at desc, id desc) as rn_last,
      count(*)     over (partition by sid)                                   as sess_pv
    from cur c
  ),
  first_rows as (select * from ranked where rn_first = 1),
  last_rows  as (select * from ranked where rn_last = 1),
  kpi_cur as (
    select
      count(*)                                                as views,
      count(distinct visitor_id)                              as visitors,
      count(distinct sid)                                     as sessions,
      count(distinct visitor_id) filter (where is_new_visitor) as new_visitors,
      count(*) filter (where rn_first = 1 and sess_pv = 1)    as bounces
    from ranked
  ),
  kpi_prev as (
    select
      count(*)                                                as views,
      count(distinct visitor_id)                              as visitors,
      count(distinct sid)                                     as sessions,
      count(distinct visitor_id) filter (where is_new_visitor) as new_visitors,
      (select count(*) from (select sid from prev group by sid having count(*) = 1) b) as bounces
    from prev
  ),
  series as (
    select i,
           v_cur_start  + i * v_step as cur_bucket,
           v_prev_start + i * v_step as prev_bucket
    from generate_series(0, v_n - 1) as i
  ),
  cur_b as (
    select date_trunc(v_trunc, local_ts) as b,
           count(*) as views, count(distinct visitor_id) as visitors, count(distinct sid) as sessions
    from cur group by 1
  ),
  prev_b as (
    select date_trunc(v_trunc, local_ts) as b,
           count(*) as views, count(distinct visitor_id) as visitors, count(distinct sid) as sessions
    from prev group by 1
  )
  select jsonb_build_object(
    'kpi',      (select to_jsonb(k) from kpi_cur k),
    'kpi_prev', (select to_jsonb(k) from kpi_prev k),

    'series', (
      select coalesce(jsonb_agg(jsonb_build_object(
          'b',         to_char(s.cur_bucket, 'YYYY-MM-DD"T"HH24:MI'),
          'views',     coalesce(c.views, 0),
          'visitors',  coalesce(c.visitors, 0),
          'sessions',  coalesce(c.sessions, 0),
          'pviews',    coalesce(p.views, 0),
          'pvisitors', coalesce(p.visitors, 0),
          'psessions', coalesce(p.sessions, 0)
        ) order by s.i), '[]'::jsonb)
      from series s
      left join cur_b  c on c.b = s.cur_bucket
      left join prev_b p on p.b = s.prev_bucket
    ),

    -- شنبه=۰ ... جمعه=۶
    'heatmap', (
      select coalesce(jsonb_agg(jsonb_build_object('d', d, 'h', h, 'v', v)), '[]'::jsonb)
      from (
        select ((extract(dow from local_ts)::int + 1) % 7) as d,
               extract(hour from local_ts)::int            as h,
               count(*)                                    as v
        from cur group by 1, 2
      ) t
    ),

    'top_pages', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.views desc), '[]'::jsonb)
      from (select page, count(*) as views, count(distinct visitor_id) as visitors
            from cur group by page order by views desc limit 15) t
    ),
    'entry_pages', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.sessions desc), '[]'::jsonb)
      from (select page, count(*) as sessions
            from first_rows group by page order by sessions desc limit 10) t
    ),
    'exit_pages', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.sessions desc), '[]'::jsonb)
      from (select page, count(*) as sessions
            from last_rows group by page order by sessions desc limit 10) t
    ),
    'top_products', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.views desc), '[]'::jsonb)
      from (select page, count(*) as views, count(distinct visitor_id) as visitors
            from cur where page like '/product/%'
            group by page order by views desc limit 10) t
    ),
    'page_types', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.views desc), '[]'::jsonb)
      from (
        select case
                 when page = '/'                       then 'home'
                 when page like '/product/%'           then 'product'
                 when page like '/shop%'               then 'shop'
                 when page like '/blog%'
                   or page like '/buying-guide%'       then 'content'
                 when page like '/cart%'               then 'cart'
                 when page like '/checkout%'           then 'checkout'
                 when page like '/order-success%'      then 'order_success'
                 else 'other'
               end as k,
               count(*) as views
        from cur group by 1
      ) t
    ),

    'channels', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.n desc), '[]'::jsonb)
      from (select case when channel = 'internal' then 'direct' else channel end as k, count(*) as n
            from first_rows where channel is not null group by 1) t
    ),
    'referrers', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.n desc), '[]'::jsonb)
      from (select referrer_host as k, count(*) as n
            from first_rows where referrer_host is not null
            group by 1 order by n desc limit 10) t
    ),
    'campaigns', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.n desc), '[]'::jsonb)
      from (select utm_source, utm_medium, utm_campaign, count(*) as n
            from first_rows where utm_source is not null or utm_campaign is not null
            group by 1, 2, 3 order by n desc limit 10) t
    ),
    'devices', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.n desc), '[]'::jsonb)
      from (select device as k, count(*) as n from first_rows where device is not null group by 1) t
    ),
    'browsers', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.n desc), '[]'::jsonb)
      from (select browser as k, count(*) as n from first_rows where browser is not null
            group by 1 order by n desc limit 8) t
    ),
    'os', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.n desc), '[]'::jsonb)
      from (select os as k, count(*) as n from first_rows where os is not null
            group by 1 order by n desc limit 8) t
    ),
    'countries', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.n desc), '[]'::jsonb)
      from (select country as k, count(*) as n from first_rows where country is not null
            group by 1 order by n desc limit 12) t
    ),

    'depth', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from (select case when sess_pv = 1 then '1'
                        when sess_pv = 2 then '2'
                        when sess_pv = 3 then '3'
                        when sess_pv <= 5 then '4-5'
                        else '6+' end as k,
                   count(*) as n
            from first_rows group by 1) t
    ),

    -- قیف خرید: چند نشست به هر مرحله رسیدن
    'funnel', (
      select jsonb_build_object(
        'product',  count(distinct sid) filter (where page like '/product/%'),
        'cart',     count(distinct sid) filter (where page like '/cart%'),
        'checkout', count(distinct sid) filter (where page like '/checkout%'),
        'success',  count(distinct sid) filter (where page like '/order-success%')
      ) from cur
    ),

    'total_all_time', (select count(*) from public.page_views)
  ) into v_result;

  return v_result;
end;
$$;

-- 5) تابع آمار زنده (کاربران آنلاین)
create or replace function public.analytics_realtime()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'active_5m', (select count(distinct visitor_id) from public.page_views
                  where created_at > now() - interval '5 minutes'),
    'views_30m', (select count(*) from public.page_views
                  where created_at > now() - interval '30 minutes'),
    'pages', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.n desc), '[]'::jsonb)
      from (select split_part(path, '?', 1) as page, count(distinct visitor_id) as n
            from public.page_views
            where created_at > now() - interval '5 minutes'
            group by 1 order by n desc limit 6) t
    ),
    'per_minute', (
      select coalesce(jsonb_agg(coalesce(c.n, 0) order by m.i desc), '[]'::jsonb)
      from generate_series(0, 29) as m(i)
      left join (
        select floor(extract(epoch from (now() - created_at)) / 60)::int as mi, count(*) as n
        from public.page_views
        where created_at > now() - interval '30 minutes'
        group by 1
      ) c on c.mi = m.i
    )
  ) into v_result;

  return v_result;
end;
$$;

-- 6) فقط سرور بتونه این توابع رو صدا بزنه
revoke all on function public.analytics_overview(timestamptz, timestamptz, timestamptz, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.analytics_overview(timestamptz, timestamptz, timestamptz, timestamptz, text)
  to service_role;

revoke all on function public.analytics_realtime() from public, anon, authenticated;
grant execute on function public.analytics_realtime() to service_role;

-- 7) به PostgREST بگو ساختار جدید رو بخونه
notify pgrst, 'reload schema';
