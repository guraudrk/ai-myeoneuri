# Supabase 마이그레이션 목록

이 파일은 ai-myeoneuri 프로젝트의 모든 Supabase 마이그레이션 SQL 파일을 정리한 단일 진실 소스다.

실행 전 Supabase Dashboard > SQL Editor에서 검증 쿼리를 먼저 실행해 현재 상태를 확인한다.

---

## 실행 순서 (의존 관계 순)

```
M-1 analytics-events  →  M-2 subscriptions
```

M-1과 M-2는 독립적이지만, 구독 기반 기능(entitlements)이 계측 이벤트를 참조하므로 M-1 먼저 실행을 권장한다.

---

## M-1 — analytics-events

| 항목 | 내용 |
|---|---|
| **파일** | `docs/migration-analytics-events.sql` |
| **기능** | F0 계측 파이프라인 |
| **생성일** | 2026-08-14 (B-1 슬라이스) |
| **실행 여부** | **불명** — 오너가 Supabase Dashboard에서 확인 필요 |
| **멱등성** | `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` — 재실행 안전 |

### 생성 객체

| 타입 | 이름 | 설명 |
|---|---|---|
| TABLE | `public.events` | 앱 이벤트 로그 (id, name, props, device_id, user_id, ts, app_version) |
| INDEX | `events_name_ts` | 이벤트명+시각 복합 인덱스 |
| INDEX | `events_device_id` | 기기 ID 인덱스 |
| INDEX | `events_user_id` | 로그인 사용자 인덱스 (nullable) |
| VIEW | `public.v_fusr` | FUSR (First-Utterance Success Rate) 일별 집계 |
| VIEW | `public.v_retention` | D7/D30 기기 리텐션 코호트 |
| VIEW | `public.v_conversion` | 무료→유료 전환율 주별 집계 |
| VIEW | `public.v_ai_cost_monthly` | 기기별 월간 Gemini API 비용 추정 |

### 검증 쿼리

```sql
-- 실행됐으면 events 테이블이 있어야 한다
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'events'
) AS events_table_exists;

-- 뷰 4개 존재 확인
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('v_fusr', 'v_retention', 'v_conversion', 'v_ai_cost_monthly');
```

---

## M-2 — subscriptions

| 항목 | 내용 |
|---|---|
| **파일** | `docs/migration-subscriptions.sql` |
| **기능** | F1 결제·구독 |
| **생성일** | 2026-08-14 (B-2 슬라이스) |
| **실행 여부** | **불명** — 오너가 Supabase Dashboard에서 확인 필요 |
| **멱등성** | `CREATE TABLE IF NOT EXISTS` — 재실행 안전 |
| **선행 조건** | RevenueCat 계정 + Play Console 구독 상품 2개 등록 필요 (코드 없이도 실행 가능) |

### 생성 객체

| 타입 | 이름 | 설명 |
|---|---|---|
| TABLE | `public.subscriptions` | RevenueCat 웹훅이 upsert하는 구독 상태 테이블 |
| INDEX | `subscriptions_user_id` | user_id 인덱스 |
| INDEX | `subscriptions_rc_app_user_id` | RevenueCat App User ID 인덱스 |
| FUNCTION | `public.set_updated_at()` | updated_at 자동 갱신 트리거 함수 |
| TRIGGER | `subscriptions_updated_at` | subscriptions 테이블 갱신 시 updated_at 자동 세팅 |
| VIEW | `public.v_active_subscribers` | 티어별 활성 구독자 수 |

### 검증 쿼리

```sql
-- subscriptions 테이블 존재 확인
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'subscriptions'
) AS subscriptions_table_exists;

-- 트리거 확인
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'subscriptions';
```

---

## M-SL — safety-bridge (SilverLink 저장소)

| 항목 | 내용 |
|---|---|
| **파일** | `../silverlink-web-input/docs/migration-v2-ai-myeoneuri-safety-bridge.sql` |
| **기능** | AI 며느리 → SilverLink safety_alerts 연동 |
| **생성일** | 2026-08-11 |
| **실행 여부** | **미실행** — PRD P-1 섹션에 명시된 대기 블로커 |
| **멱등성** | `ADD COLUMN IF NOT EXISTS` — 재실행 안전 |

### 변경 내용

1. `safety_alerts.call_id` — NOT NULL 제약 해제 (nullable 허용)
2. `safety_alerts.source` — 신규 컬럼 추가 (`'call_recording' | 'ai_myeoneuri'`)

### 이 마이그레이션 없이 발생하는 증상

- AI 며느리에서 `safetyAlertBridge.sendAlert()`를 호출하면 DB INSERT 실패
- 오류: `null value in column "call_id" of relation "safety_alerts" violates not-null constraint`

### 검증 쿼리 (SilverLink Supabase에서 실행)

```sql
-- source 컬럼이 추가됐는지 확인
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'safety_alerts'
  AND column_name IN ('call_id', 'source')
ORDER BY ordinal_position;
-- 기대값: call_id is_nullable=YES, source is_nullable=NO default='call_recording'
```

---

## 오너 확인 체크리스트

```
[ ] Supabase Dashboard > Table Editor에서 events 테이블 존재 확인 (M-1)
[ ] Supabase Dashboard > Table Editor에서 subscriptions 테이블 존재 확인 (M-2)
[ ] SilverLink Supabase에서 safety_alerts.source 컬럼 존재 확인 (M-SL)
[ ] M-SL 미실행 시 → silverlink-web-input/docs/migration-v2-ai-myeoneuri-safety-bridge.sql 실행
```
