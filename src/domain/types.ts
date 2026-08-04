import { z } from "zod";

export const RiskLevel = z.enum(["low", "medium", "high"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const AssistantActionSchema = z.object({
  type: z.enum([
    "search_contacts",
    "call_contact",
    "call_phone_number",
    "open_app",
    "create_reminder",
    "request_guardian_approval",
  ]),
  params: z.record(z.unknown()),
});
export type AssistantAction = z.infer<typeof AssistantActionSchema>;

export const AssistantCommandSchema = z.object({
  requestId: z.string().min(1),
  intent: z.string().min(1),
  riskLevel: RiskLevel,
  requiresConfirmation: z.boolean(),
  userFacingSummary: z.string().min(1),
  actions: z.array(AssistantActionSchema).min(1),
});
export type AssistantCommand = z.infer<typeof AssistantCommandSchema>;

export interface ContactCandidate {
  id: string;
  name: string;
  /** 마스킹된 번호 표시용. 실제 번호는 PhoneAdapter에 별도 전달. */
  maskedNumber: string;
  relationship?: string;
}

export interface AuditEntry {
  requestId: string;
  timestamp: string;
  intent: string;
  outcome: "completed" | "cancelled" | "error" | "blocked";
  /** 개인정보는 마스킹 후 기록 */
  detail?: string;
}
