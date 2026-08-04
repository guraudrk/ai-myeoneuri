import type { AssistantAction, RiskLevel } from "./types";

const ACTION_RISK: Record<AssistantAction["type"], RiskLevel> = {
  search_contacts: "low",
  call_contact: "medium",
  call_phone_number: "medium",
  open_app: "low",
  create_reminder: "low",
  request_guardian_approval: "low",
};

export function getActionRisk(type: AssistantAction["type"]): RiskLevel {
  return ACTION_RISK[type];
}

/** 사용자 확인이 필요한 액션 여부 */
export function requiresConfirmation(type: AssistantAction["type"]): boolean {
  return type === "call_contact" || type === "call_phone_number";
}
