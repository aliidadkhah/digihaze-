-- =====================================================
-- import.sql — وارد کردن داده‌های JSON به دیتابیس محلی
--
-- فایل‌های JSON باید توی /var/lib/postgresql/dhmig باشن (کاربر postgres
-- به /root دسترسی نداره). اجرا:
--   sudo -u postgres psql -d digihaze -v ON_ERROR_STOP=1 < scripts/migration/import.sql
--
-- همه‌چیز توی یک تراکنشه: اگه جایی خطا بده، هیچ داده‌ای وارد نمی‌شه.
-- =====================================================
\set ON_ERROR_STOP on
begin;

\set j `cat /var/lib/postgresql/dhmig/customers.json`
insert into public.customers select * from jsonb_populate_recordset(null::public.customers, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/discount_codes.json`
insert into public.discount_codes select * from jsonb_populate_recordset(null::public.discount_codes, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/orders.json`
insert into public.orders select * from jsonb_populate_recordset(null::public.orders, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/order_items.json`
insert into public.order_items select * from jsonb_populate_recordset(null::public.order_items, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/otp_codes.json`
insert into public.otp_codes select * from jsonb_populate_recordset(null::public.otp_codes, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/page_views.json`
insert into public.page_views select * from jsonb_populate_recordset(null::public.page_views, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/phone_verify_tokens.json`
insert into public.phone_verify_tokens select * from jsonb_populate_recordset(null::public.phone_verify_tokens, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/posts.json`
insert into public.posts select * from jsonb_populate_recordset(null::public.posts, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/post_comments.json`
insert into public.post_comments select * from jsonb_populate_recordset(null::public.post_comments, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/product_questions.json`
insert into public.product_questions select * from jsonb_populate_recordset(null::public.product_questions, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/product_reviews.json`
insert into public.product_reviews select * from jsonb_populate_recordset(null::public.product_reviews, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/products.json`
insert into public.products select * from jsonb_populate_recordset(null::public.products, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/profiles.json`
insert into public.profiles select * from jsonb_populate_recordset(null::public.profiles, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/settings.json`
insert into public.settings select * from jsonb_populate_recordset(null::public.settings, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/story_groups.json`
insert into public.story_groups select * from jsonb_populate_recordset(null::public.story_groups, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/support_conversations.json`
insert into public.support_conversations select * from jsonb_populate_recordset(null::public.support_conversations, :'j'::jsonb);

\set j `cat /var/lib/postgresql/dhmig/support_messages.json`
insert into public.support_messages select * from jsonb_populate_recordset(null::public.support_messages, :'j'::jsonb);

-- شمارنده‌ی شناسه‌ی سفارش‌ها از بزرگ‌ترین شناسه‌ی موجود ادامه پیدا کنه
select setval(pg_get_serial_sequence('public.orders', 'id'),
              greatest((select coalesce(max(id), 0) from public.orders), 1));
select setval(pg_get_serial_sequence('public.order_items', 'id'),
              greatest((select coalesce(max(id), 0) from public.order_items), 1));

commit;

-- تعداد ردیف‌ها (با خلاصه‌ی اسکریپت export مقایسه کن)
select 'customers' as table_name, count(*) as rows from public.customers
union all
select 'discount_codes' as table_name, count(*) as rows from public.discount_codes
union all
select 'orders' as table_name, count(*) as rows from public.orders
union all
select 'order_items' as table_name, count(*) as rows from public.order_items
union all
select 'otp_codes' as table_name, count(*) as rows from public.otp_codes
union all
select 'page_views' as table_name, count(*) as rows from public.page_views
union all
select 'phone_verify_tokens' as table_name, count(*) as rows from public.phone_verify_tokens
union all
select 'posts' as table_name, count(*) as rows from public.posts
union all
select 'post_comments' as table_name, count(*) as rows from public.post_comments
union all
select 'product_questions' as table_name, count(*) as rows from public.product_questions
union all
select 'product_reviews' as table_name, count(*) as rows from public.product_reviews
union all
select 'products' as table_name, count(*) as rows from public.products
union all
select 'profiles' as table_name, count(*) as rows from public.profiles
union all
select 'settings' as table_name, count(*) as rows from public.settings
union all
select 'story_groups' as table_name, count(*) as rows from public.story_groups
union all
select 'support_conversations' as table_name, count(*) as rows from public.support_conversations
union all
select 'support_messages' as table_name, count(*) as rows from public.support_messages;
