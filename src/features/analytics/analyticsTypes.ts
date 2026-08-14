/** B-1 계측 이벤트 타입 정의
 * PII 절대 금지: 전화번호·이름·문자 원문을 props에 포함하지 않는다.
 */

/** 계층형 의도해석 레이어 (B-3에서 실제로 구분됨, 지금은 항상 L3) */
export type ResolvedBy = "L0" | "L1" | "L2" | "L3";

export interface AppOpenPayload        { launch_type: "cold" | "warm"; app_version: string }
export interface UtteranceStartedPayload { input_method: "voice" | "text" }
export interface UtteranceRecognizedPayload { attempt: number; input_method: "voice" | "text" }
export interface UtteranceFailedPayload  { attempt: number; error_code: string; input_method: "voice" | "text" }
export interface IntentParsedPayload     { intent: string; resolved_by: ResolvedBy }
export interface ActionCompletedPayload  { intent: string }
export interface ActionCancelledPayload  { intent: string }
export interface PaywallShownPayload     { tier: "safety" | "safety_plus" }
export interface SubscribeStartedPayload { tier: "safety" | "safety_plus" }
export interface SubscribeCompletedPayload { tier: "safety" | "safety_plus" }
export type     LinkCreatedPayload       = Record<string, never>
export interface AiCostIncurredPayload   { model: string; input_tokens: number; output_tokens: number }

export type AnalyticsEventMap = {
  app_open:             AppOpenPayload;
  utterance_started:    UtteranceStartedPayload;
  utterance_recognized: UtteranceRecognizedPayload;
  utterance_failed:     UtteranceFailedPayload;
  intent_parsed:        IntentParsedPayload;
  action_completed:     ActionCompletedPayload;
  action_cancelled:     ActionCancelledPayload;
  paywall_shown:        PaywallShownPayload;
  subscribe_started:    SubscribeStartedPayload;
  subscribe_completed:  SubscribeCompletedPayload;
  link_created:         LinkCreatedPayload;
  ai_cost_incurred:     AiCostIncurredPayload;
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export interface QueuedEvent {
  id: string;
  name: AnalyticsEventName;
  props: AnalyticsEventMap[AnalyticsEventName];
  device_id: string;
  user_id: string | null;
  ts: string;
  app_version: string;
}
