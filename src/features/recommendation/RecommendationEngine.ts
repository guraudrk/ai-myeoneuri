import {
  getRecentLogs,
  getTodayLogs,
  getShownMap,
  getSnoozeMap,
  getAcceptanceRates,
  type EventLog,
} from "./EventLogService";

// ── 가중치 설정 ────────────────────────────────────────────────────────────────
const WEIGHTS = {
  periodicity:  0.35,
  timeslot:     0.25,
  recency:      0.20,
  acceptance:   0.20,
} as const;

// ── 필터 설정 ──────────────────────────────────────────────────────────────────
const FILTERS = {
  suppressHourStart: 22,    // 야간 표시 억제 시작 (22:00)
  suppressHourEnd:   7,     // 야간 표시 억제 종료  (07:00)
  snoozeDays:        3,
  maxExposuresPerDay:3,
  coldStartDays:     7,
} as const;

export type RecommendationRule = "R1" | "R2" | "R3";

export interface Recommendation {
  contactId:   string;
  contactName: string;
  reason:      string;    // 20sp+ 표시용 이유 문구
  score:       number;
  rule:        RecommendationRule;
}

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

function groupByContact(logs: EventLog[]): Map<string, EventLog[]> {
  const m = new Map<string, EventLog[]>();
  for (const e of logs) {
    const arr = m.get(e.targetId) ?? [];
    arr.push(e);
    m.set(e.targetId, arr);
  }
  return m;
}

/** 야간 억제 확인 */
function isNighttime(): boolean {
  const h = new Date().getHours();
  return h >= FILTERS.suppressHourStart || h < FILTERS.suppressHourEnd;
}

/** 현재 시각 시간대 (0~23) */
function currentHour(): number {
  return new Date().getHours();
}

// ── R1: 주기성 이탈 ───────────────────────────────────────────────────────────
// 각 연락처의 평균 통화 간격 대비 현재 경과 시간이 클수록 추천 점수 높음

interface R1Score {
  contactId:   string;
  contactName: string;
  score:       number;
  daysSinceLast: number;
}

function computeR1(byContact: Map<string, EventLog[]>): R1Score[] {
  const now = Date.now();
  const result: R1Score[] = [];

  for (const [id, logs] of byContact) {
    if (logs.length < 2) continue;
    const sorted = [...logs].sort((a, b) => a.startedAt - b.startedAt);
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(sorted[i].startedAt - sorted[i - 1].startedAt);
    }
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const daysSinceLast = (now - sorted[sorted.length - 1].startedAt) / 86_400_000;
    const avgDays = avgInterval / 86_400_000;
    if (avgDays < 0.1) continue;                           // 같은 날 여러 번 — 건너뜀
    const deviation = daysSinceLast / avgDays;             // 1.0 = 평균 주기 정확히 경과
    result.push({
      contactId:   id,
      contactName: sorted[0].targetName,
      score:       Math.min(deviation, 3) / 3,             // 3배 초과 → 1.0 포화
      daysSinceLast,
    });
  }
  return result;
}

// ── R2: 시간대 습관 ───────────────────────────────────────────────────────────
// 현재 시간대(±1시간)에 이 연락처를 통화한 이력 비율

interface R2Score {
  contactId:   string;
  contactName: string;
  score:       number;
}

function computeR2(byContact: Map<string, EventLog[]>): R2Score[] {
  const hour = currentHour();
  const result: R2Score[] = [];
  for (const [id, logs] of byContact) {
    const sameslot = logs.filter((e) => {
      const h = new Date(e.startedAt).getHours();
      return Math.abs(h - hour) <= 1 || Math.abs(h - hour) >= 23;  // 23시~1시 경계 처리
    });
    result.push({
      contactId:   id,
      contactName: logs[0].targetName,
      score:       sameslot.length / Math.max(logs.length, 1),
    });
  }
  return result;
}

// ── R3: 미연결 재시도 ─────────────────────────────────────────────────────────
// 최근 7일 내 no_answer / failed 이력이 있는 연락처

interface R3Score {
  contactId:   string;
  contactName: string;
  score:       number;
  lastFailed:  number;
}

function computeR3(byContact: Map<string, EventLog[]>): R3Score[] {
  const sevenDays = Date.now() - 7 * 86_400_000;
  const result: R3Score[] = [];
  for (const [id, logs] of byContact) {
    const failed = logs.filter(
      (e) => e.startedAt >= sevenDays && (e.outcome === "no_answer" || e.outcome === "failed")
    );
    if (failed.length === 0) continue;
    const lastFailed = Math.max(...failed.map((e) => e.startedAt));
    const daysSince = (Date.now() - lastFailed) / 86_400_000;
    // 1일 이내 → 점수 1.0, 7일 → 점수 0
    result.push({
      contactId:   id,
      contactName: logs[0].targetName,
      score:       Math.max(0, 1 - daysSince / 7),
      lastFailed,
    });
  }
  return result;
}

// ── 필터: 오늘 이미 연락한 연락처 제외 ─────────────────────────────────────────
async function getTodayContactedIds(): Promise<Set<string>> {
  const today = await getTodayLogs();
  return new Set(today.filter((e) => e.type === "call" && e.outcome === "success").map((e) => e.targetId));
}

// ── 최종 추천 계산 ─────────────────────────────────────────────────────────────
export async function getTopRecommendation(): Promise<Recommendation | null> {
  // 야간 억제
  if (isNighttime()) return null;

  const logs    = await getRecentLogs(30);
  if (logs.length < 3) return null;                         // 데이터 부족 (cold start)

  const byContact     = groupByContact(logs);
  const todayContacted = await getTodayContactedIds();
  const shownMap      = await getShownMap();
  const snoozeMap     = await getSnoozeMap();
  const rates         = await getAcceptanceRates();

  const today = new Date().toISOString().slice(0, 10);
  const now   = Date.now();

  const r1scores = computeR1(byContact);
  const r2scores = computeR2(byContact);
  const r3scores = computeR3(byContact);

  // 점수 맵 조합
  type CandidateEntry = {
    contactId: string; contactName: string;
    r1: number; r2: number; r3: number; rule: RecommendationRule;
  };

  const all: CandidateEntry[] = [];
  for (const [id, logs] of byContact) {
    const r1 = r1scores.find((x) => x.contactId === id)?.score ?? 0;
    const r2 = r2scores.find((x) => x.contactId === id)?.score ?? 0;
    const r3 = r3scores.find((x) => x.contactId === id)?.score ?? 0;
    const dominantRule: RecommendationRule =
      r3 >= r1 && r3 >= r2 ? "R3" :
      r1 >= r2             ? "R1" : "R2";
    all.push({ contactId: id, contactName: logs[0].targetName, r1, r2, r3, rule: dominantRule });
  }

  // 필터 적용
  const filtered = all.filter(({ contactId }) => {
    // 오늘 이미 성공적으로 연락한 연락처 제외
    if (todayContacted.has(contactId)) return false;

    // 스누즈 중인 연락처 제외
    const snoozedUntil = snoozeMap[contactId];
    if (snoozedUntil && snoozedUntil > now) return false;

    // 오늘 최대 3번 노출 초과 제외
    const shown = shownMap[contactId];
    if (shown?.shownDate === today && (shown.shownToday ?? 0) >= FILTERS.maxExposuresPerDay) return false;

    return true;
  });

  if (filtered.length === 0) return null;

  // 최종 점수 계산
  const scored = filtered.map(({ contactId, contactName, r1, r2, r3, rule }) => {
    const recency     = r1;                                  // R1이 recency 역할 겸함
    const acceptance  = rates[contactId] ?? 0.5;
    const score       =
      WEIGHTS.periodicity * r1 +
      WEIGHTS.timeslot    * r2 +
      WEIGHTS.recency     * recency +
      WEIGHTS.acceptance  * acceptance;
    return { contactId, contactName, score, rule, r1, r2, r3 };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  if (!top || top.score < 0.15) return null;               // 최소 임계값 미달

  // 이유 문구 (템플릿 기반 — LLM 없음)
  const REASONS: Record<RecommendationRule, (name: string) => string> = {
    R1: (n) => `${n} 님과 연락한 지 좀 됐어요`,
    R2: (n) => `평소 이 시간에 ${n} 님께 자주 연락하셨어요`,
    R3: (n) => `${n} 님과 마지막 통화가 연결되지 않았어요`,
  };

  return {
    contactId:   top.contactId,
    contactName: top.contactName,
    reason:      REASONS[top.rule](top.contactName),
    score:       top.score,
    rule:        top.rule,
  };
}

/** 개발 모드: 규칙별 수락률 조회 */
export async function getDevStats(): Promise<{
  totalLogs: number;
  contactCount: number;
  rates: Record<string, number>;
  coldStart: boolean;
}> {
  const logs  = await getRecentLogs(30);
  const rates = await getAcceptanceRates();
  const byC   = groupByContact(logs);
  return {
    totalLogs:    logs.length,
    contactCount: byC.size,
    rates,
    coldStart:    logs.length < 3,
  };
}
