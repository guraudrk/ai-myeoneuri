/**
 * L0 — 슬롯 템플릿 (정규식, 비용 0원, 즉시 반환)
 * 명확한 발화 패턴만 처리. 불확실하면 null 반환 → L1으로 폴백.
 */

import type { ParsedIntent, SafetyCategory } from "./intentParser";
import { safetyseverity } from "./intentParser";
import { resolvePackageName } from "./appPackages";

function norm(s: string) { return s.replace(/\s+/g, "").toLowerCase(); }

type Rule = {
  test: (u: string, n: string) => RegExpMatchArray | null;
  resolve: (m: RegExpMatchArray, u: string) => ParsedIntent;
};

const RULES: Rule[] = [
  // ─── date_time ───────────────────────────────────────────────────────────────
  {
    test: (_, n) => n.match(/날짜|요일|몇시|지금시간|몇월|무슨요일|오늘날짜|지금몇/),
    resolve: () => ({ intent: "date_time", resolved_by: "L0" }),
  },
  // ─── conversation_summary ────────────────────────────────────────────────────
  {
    test: (_, n) => n.match(/오늘뭐했|아까뭐했|기록알려|대화요약|대화정리|대화기록|뭐이야기/),
    resolve: () => ({ intent: "conversation_summary", resolved_by: "L0" }),
  },
  // ─── sos ─────────────────────────────────────────────────────────────────────
  {
    test: (u) => u.match(/^(?:살려줘|도와줘[!?]*|구해줘|제발도와|제발살려)/i),
    resolve: () => ({ intent: "sos", resolved_by: "L0" }),
  },
  // ─── calm_down ───────────────────────────────────────────────────────────────
  {
    test: (u) => u.match(/^(?:무서워|어떡하지|모르겠어|이상해|어쩌지|어떻게해)/i),
    resolve: () => ({ intent: "calm_down", resolved_by: "L0" }),
  },
  // ─── emergency_family ────────────────────────────────────────────────────────
  {
    test: (_, n) => n.match(/(?:가족|보호자|아들|딸)(?:불러줘|연락해줘|도와줘)/),
    resolve: () => ({ intent: "emergency_family", resolved_by: "L0" }),
  },
  // ─── safety_concern 명백한 것만 ───────────────────────────────────────────────
  {
    test: (_, n) => n.match(/넘어졌|쓰러졌|떨어졌/),
    resolve: (_, u) => {
      const cat: SafetyCategory = "fall_risk";
      return { intent: "safety_concern", category: cat, severity: safetyseverity(cat), utterance: u, resolved_by: "L0" };
    },
  },
  // ─── call_contact  ───────────────────────────────────────────────────────────
  // "엄마한테 전화해줘" / "김철수에게 연락해줘"
  {
    test: (u) => u.match(/^(.+?)(?:한테|에게|께)\s*(?:전화|연락|통화)\s*(?:해줘|해|주세요|해\s*줘)?$/),
    resolve: (m) => ({ intent: "call_contact", contactName: m[1].trim(), resolved_by: "L0" }),
  },
  // "엄마 전화해줘" (조사 없이)
  {
    test: (u) => u.match(/^(.+?)\s+(?:전화해줘|전화해|연락해줘|연락해)$/),
    resolve: (m) => ({ intent: "call_contact", contactName: m[1].trim(), resolved_by: "L0" }),
  },
  // ─── open_app ────────────────────────────────────────────────────────────────
  {
    test: (u) => u.match(/^(.+?)\s*(?:켜줘|열어줘|실행해줘|띄워줘|켜\s*줘|열어\s*줘)$/),
    resolve: (m) => {
      const appName = m[1].trim();
      return { intent: "open_app", appName, packageName: resolvePackageName(appName), resolved_by: "L0" };
    },
  },
];

export function tryL0(utterance: string): ParsedIntent | null {
  const n = norm(utterance);
  for (const rule of RULES) {
    const m = rule.test(utterance, n);
    if (m) return rule.resolve(m, utterance);
  }
  return null;
}
