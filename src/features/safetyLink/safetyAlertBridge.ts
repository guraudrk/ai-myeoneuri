import { supabase } from "@/features/supabase/supabaseClient";
import { getLinkData } from "@/features/supabase/linkService";
import type { SafetyCategory, SafetySeverity } from "@/features/intent/intentParser";

const CATEGORY_META: Record<SafetyCategory, { title: string; description: (utterance: string) => string }> = {
  fall_risk:            { title: "낙상 위험 감지",      description: (u) => `AI 며느리 대화 중 낙상 우려 발언: "${u}"` },
  medication_concern:   { title: "약 복용 우려",         description: (u) => `AI 며느리 대화 중 약 복용 이상 발언: "${u}"` },
  nutrition_concern:    { title: "식사 우려",            description: (u) => `AI 며느리 대화 중 식사 관련 우려 발언: "${u}"` },
  mental_health_concern:{ title: "정신건강 우려",        description: (u) => `AI 며느리 대화 중 우울·외로움 발언: "${u}"` },
  mobility_concern:     { title: "거동 불편",            description: (u) => `AI 며느리 대화 중 이동 어려움 발언: "${u}"` },
  social_isolation:     { title: "사회적 고립 징후",     description: (u) => `AI 며느리 대화 중 고립 관련 발언: "${u}"` },
  urgent_medical:       { title: "긴급 의료 상황",       description: (u) => `AI 며느리 대화 중 응급 발언: "${u}"` },
};

export async function reportSafetyConcernToSilverLink(
  category: SafetyCategory,
  severity: SafetySeverity,
  utterance: string
): Promise<void> {
  const link = await getLinkData();
  if (!link.linked) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const meta = CATEGORY_META[category];

  await supabase.from("safety_alerts").insert({
    elder_id:       link.elderId,
    owner_user_id:  user.id,
    category,
    severity,
    title:          meta.title,
    description:    meta.description(utterance),
    suggestion:     null,
    source:         "ai_myeoneuri",
  });
}
