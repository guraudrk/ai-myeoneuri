-- B-1 계측 마이그레이션
-- 실행: Supabase Dashboard > SQL Editor
-- 테이블과 뷰는 idempotent (재실행 안전)

-- ──────────────────────────────────────────
-- 1. events 테이블
-- ──────────────────────────────────────────
create table if not exists public.events (
  id          text        primary key,   -- client-generated UUID
  name        text        not null,
  props       jsonb       not null default '{}',
  device_id   text        not null,
  user_id     uuid        references auth.users(id) on delete set null,
  ts          timestamptz not null,
  app_version text        not null default 'unknown',
  inserted_at timestamptz not null default now()
);

-- 인덱스: 뷰 쿼리 최적화
create index if not exists events_name_ts on public.events (name, ts);
create index if not exists events_device_id on public.events (device_id);
create index if not exists events_user_id   on public.events (user_id) where user_id is not null;

-- RLS: 클라이언트는 INSERT만, 조회는 서비스 롤만
alter table public.events enable row level security;

drop policy if exists "anon_insert_events" on public.events;
create policy "anon_insert_events"
  on public.events for insert
  with check (true);   -- device_id 기반, user_id는 선택

-- ──────────────────────────────────────────
-- 2. 뷰 — FUSR (First-Utterance Success Rate)
-- utterance_recognized → intent_parsed 전환율
-- ──────────────────────────────────────────
create or replace view public.v_fusr as
select
  date_trunc('day', ts) as day,
  count(*) filter (where name = 'utterance_recognized') as total_utterances,
  count(*) filter (where name = 'intent_parsed')        as parsed_count,
  round(
    count(*) filter (where name = 'intent_parsed')::numeric /
    nullif(count(*) filter (where name = 'utterance_recognized'), 0) * 100,
    1
  ) as fusr_pct
from public.events
where name in ('utterance_recognized', 'intent_parsed')
group by 1
order by 1 desc;

-- ──────────────────────────────────────────
-- 3. 뷰 — D7 / D30 기기 리텐션
-- ──────────────────────────────────────────
create or replace view public.v_retention as
with first_seen as (
  select device_id, min(ts::date) as cohort_day
  from public.events
  where name = 'app_open'
  group by device_id
),
activity as (
  select distinct device_id, ts::date as active_day
  from public.events
  where name = 'app_open'
)
select
  f.cohort_day,
  count(distinct f.device_id)                                              as cohort_size,
  count(distinct a7.device_id)                                             as d7_active,
  count(distinct a30.device_id)                                            as d30_active,
  round(count(distinct a7.device_id)::numeric  / count(distinct f.device_id) * 100, 1) as d7_pct,
  round(count(distinct a30.device_id)::numeric / count(distinct f.device_id) * 100, 1) as d30_pct
from first_seen f
left join activity a7  on a7.device_id = f.device_id
  and a7.active_day between f.cohort_day + 6 and f.cohort_day + 8
left join activity a30 on a30.device_id = f.device_id
  and a30.active_day between f.cohort_day + 29 and f.cohort_day + 31
group by f.cohort_day
order by f.cohort_day desc;

-- ──────────────────────────────────────────
-- 4. 뷰 — 무료→유료 전환
-- paywall_shown → subscribe_completed
-- ──────────────────────────────────────────
create or replace view public.v_conversion as
select
  date_trunc('week', ts) as week,
  count(*) filter (where name = 'paywall_shown')       as paywall_shown_cnt,
  count(*) filter (where name = 'subscribe_started')   as started_cnt,
  count(*) filter (where name = 'subscribe_completed') as completed_cnt,
  round(
    count(*) filter (where name = 'subscribe_completed')::numeric /
    nullif(count(*) filter (where name = 'paywall_shown'), 0) * 100,
    1
  ) as conversion_pct
from public.events
where name in ('paywall_shown', 'subscribe_started', 'subscribe_completed')
group by 1
order by 1 desc;

-- ──────────────────────────────────────────
-- 5. 뷰 — 기기별 월간 AI 비용 추정
-- L3 Gemini Flash 요금 기준
-- ──────────────────────────────────────────
create or replace view public.v_ai_cost_monthly as
select
  date_trunc('month', ts)           as month,
  device_id,
  sum((props->>'input_tokens')::int)  as total_input_tokens,
  sum((props->>'output_tokens')::int) as total_output_tokens,
  -- Gemini Flash 2.0: $0.075/1M input, $0.30/1M output (2026-08 기준)
  round(
    (sum((props->>'input_tokens')::int)  * 0.075 / 1000000
   + sum((props->>'output_tokens')::int) * 0.30  / 1000000)::numeric,
    6
  ) as est_usd
from public.events
where name = 'ai_cost_incurred'
group by 1, 2
order by 1 desc, est_usd desc;
