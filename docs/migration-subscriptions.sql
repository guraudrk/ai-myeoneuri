-- B-2 구독 마이그레이션
-- 실행: Supabase Dashboard > SQL Editor
-- RevenueCat webhook은 서버리스 함수가 아니라 Supabase Edge Function으로 구현한다
-- (B-2 scope 외 — 오너 선행 조건 참고)

-- ──────────────────────────────────────────
-- 1. subscriptions 테이블
-- RevenueCat 웹훅이 upsert하는 단일 진실 소스
-- ──────────────────────────────────────────
create table if not exists public.subscriptions (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        references auth.users(id) on delete cascade,
  rc_app_user_id text        not null unique,      -- RevenueCat App User ID
  tier           text        not null default 'free',  -- 'free' | 'safety' | 'safety_plus'
  is_active      boolean     not null default false,
  expires_at     timestamptz,
  product_id     text,
  rc_updated_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists subscriptions_user_id on public.subscriptions (user_id);
create index if not exists subscriptions_rc_app_user_id on public.subscriptions (rc_app_user_id);

alter table public.subscriptions enable row level security;

-- 본인 구독만 조회
drop policy if exists "user_read_own_subscription" on public.subscriptions;
create policy "user_read_own_subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE는 서비스 롤(webhook)만 허용 — 클라이언트 직접 쓰기 차단
-- (서비스 롤 key는 클라이언트 앱에 절대 포함하지 않는다)

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ──────────────────────────────────────────
-- 2. 뷰 — 티어별 활성 사용자 수 (주간)
-- ──────────────────────────────────────────
create or replace view public.v_active_subscribers as
select
  tier,
  count(*) filter (where is_active = true) as active_count,
  count(*) as total_count
from public.subscriptions
group by tier;

-- ──────────────────────────────────────────
-- 오너 선행 조건 체크리스트
-- ──────────────────────────────────────────
-- [ ] RevenueCat 계정 생성 → Android API Key 발급
--     → ai-myeoneuri/.env.local 에 EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=<key> 추가
-- [ ] Google Play Console > 인앱 상품 > 구독 2개 생성:
--     - safety_guard       : 안심 9,900원/월
--     - safety_plus_guard  : 안심+ 16,900원/월
-- [ ] RevenueCat > Entitlements 2개 생성:
--     - safety_guard
--     - safety_plus_guard
-- [ ] RevenueCat > Webhooks > Supabase Edge Function URL 연결
--     (Edge Function: supabase/functions/revenuecat-webhook/index.ts — B-2 next task)
