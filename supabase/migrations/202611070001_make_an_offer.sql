-- Apply in Supabase SQL Editor before enabling the Make an Offer feature.
create extension if not exists pgcrypto;
create table if not exists public.offer_product_rules(
 sku text primary key, enabled boolean not null default true,
 max_offers integer not null default 5 check(max_offers between 1 and 20),
 minimum_offer_usd numeric(12,2), minimum_offer_percentage numeric(5,2),
 constraint offer_one_minimum check(minimum_offer_usd is null or minimum_offer_percentage is null),
 constraint offer_min_usd_positive check(minimum_offer_usd is null or minimum_offer_usd>0),
 constraint offer_min_pct_range check(minimum_offer_percentage is null or (minimum_offer_percentage>0 and minimum_offer_percentage<100))
);
alter table public.offer_product_rules enable row level security;
revoke all on public.offer_product_rules from anon,authenticated;
grant all on public.offer_product_rules to service_role;
create table if not exists public.offers(
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references auth.users(id) on delete cascade,
 sku text not null, product_name_snapshot text not null, asking_price_usd numeric(12,4) not null check(asking_price_usd>0),
 offer_amount_usd numeric(12,4) not null check(offer_amount_usd>0), displayed_amount numeric(14,2) not null,
 displayed_currency text not null check(displayed_currency in('USD','FCFA')), exchange_rate numeric(12,4) not null default 600,
 customer_name text not null, customer_email text not null, customer_phone text, message varchar(250),
 customer_language text not null check(customer_language in('en','fr')),
 status text not null default 'pending' check(status in('pending','accepted','declined','countered','expired','withdrawn')),
 attempts_used integer not null, idempotency_key uuid not null, expires_at timestamptz, created_at timestamptz not null default now(),
 unique(customer_id,idempotency_key)
);
create index if not exists offers_customer_sku_idx on public.offers(customer_id,sku,created_at desc);
alter table public.offers enable row level security;
drop policy if exists offers_customer_read_own on public.offers;
create policy offers_customer_read_own on public.offers for select to authenticated using(auth.uid()=customer_id);
revoke insert,update,delete on public.offers from anon,authenticated;
grant select on public.offers to authenticated;
grant all on public.offers to service_role;
create or replace function public.submit_offer_atomic(
 p_customer_id uuid,p_sku text,p_product_name text,p_asking_price_usd numeric,p_offer_amount_usd numeric,
 p_displayed_amount numeric,p_displayed_currency text,p_customer_name text,p_customer_email text,
 p_customer_phone text,p_message text,p_language text,p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r offer_product_rules%rowtype; used integer; floor_amount numeric; saved offers%rowtype;
begin
 select * into r from offer_product_rules where sku=p_sku and enabled for update;
 if not found then raise exception 'OFFERS_DISABLED'; end if;
 if r.minimum_offer_usd is null and r.minimum_offer_percentage is null then raise exception 'MINIMUM_NOT_CONFIGURED'; end if;
 if p_offer_amount_usd<=0 or p_offer_amount_usd>=p_asking_price_usd then raise exception 'INVALID_AMOUNT'; end if;
 if length(coalesce(p_message,''))>250 then raise exception 'MESSAGE_TOO_LONG'; end if;
 if r.minimum_offer_usd is not null then floor_amount:=r.minimum_offer_usd;
 elsif r.minimum_offer_percentage is not null then floor_amount:=p_asking_price_usd*r.minimum_offer_percentage/100;
 else floor_amount:=0; end if;
 if p_offer_amount_usd<floor_amount then raise exception 'OFFER_TOO_LOW'; end if;
 select count(*) into used from offers where customer_id=p_customer_id and sku=p_sku;
 if used>=r.max_offers then raise exception 'OFFER_LIMIT_REACHED'; end if;
 insert into offers(customer_id,sku,product_name_snapshot,asking_price_usd,offer_amount_usd,displayed_amount,displayed_currency,exchange_rate,customer_name,customer_email,customer_phone,message,customer_language,attempts_used,idempotency_key,expires_at)
 values(p_customer_id,p_sku,p_product_name,p_asking_price_usd,p_offer_amount_usd,p_displayed_amount,p_displayed_currency,600,p_customer_name,p_customer_email,nullif(p_customer_phone,''),nullif(p_message,''),p_language,used+1,p_idempotency_key,now()+interval '7 days')
 returning * into saved;
 return jsonb_build_object('offer_id',saved.id,'remaining',greatest(r.max_offers-used-1,0),'offer_amount_usd',saved.offer_amount_usd);
end $$;
revoke all on function public.submit_offer_atomic(uuid,text,text,numeric,numeric,numeric,text,text,text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.submit_offer_atomic(uuid,text,text,numeric,numeric,numeric,text,text,text,text,text,text,uuid) to service_role;

create table if not exists public.offer_status_events(
 id uuid primary key default gen_random_uuid(), offer_id uuid not null references public.offers(id) on delete cascade,
 changed_by uuid references auth.users(id), old_status text, new_status text not null, note text, created_at timestamptz not null default now()
);
alter table public.offer_status_events enable row level security;
revoke all on public.offer_status_events from anon,authenticated;
grant all on public.offer_status_events to service_role;

insert into public.offer_product_rules(sku,enabled,max_offers,minimum_offer_percentage) values
('DELL-D3551-16-512',true,5,85.00),
('LENOVO-P15S-16-512',true,5,85.00),
('DELL-L5420-8-256',true,5,85.00),
('DELL-L5420-256-NORAM',true,5,85.00),
('DELL-WD19S-180W',true,5,90.00),
('LENOVO-NEO50QG4-16-256',true,5,90.00),
('DELL-L5430-16-256',true,5,85.00),
('HP-840G5-8-256',true,5,85.00),
('MS-SURFACEPRO5-8-256',true,5,85.00),
('DELL-L3400-8-256',true,5,85.00),
('DELL-L7480-16-256',true,5,85.00),
('SAMSUNG-DDR5-8-5600',true,5,90.00),
('ATECH-DDR5-8-5600',true,5,90.00),
('SKHYNIX-DDR4-16-3200',true,5,90.00),
('CRUCIAL-DDR5-32-4800',true,5,90.00),
('DELL-XPS15-9570-16-256',true,5,85.00),
('LENOVO-14SYOGA-16-512',true,5,85.00),
('HP-ELITEBOOK-645-G10-16-512',true,5,85.00),
('HP-ELITEBOOK-X360-1040-G5-16-256',true,5,85.00),
('LENOVO-X13-YOGA-G4-I7-16-512',true,5,85.00)
on conflict(sku) do update set enabled=excluded.enabled,max_offers=excluded.max_offers,minimum_offer_percentage=excluded.minimum_offer_percentage,minimum_offer_usd=null;
