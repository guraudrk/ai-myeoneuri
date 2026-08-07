/**
 * 연락처 이름·검색 결과 등 외부 데이터를 LLM 프롬프트에 넣을 때 이스케이프한다.
 *
 * 막는 것:
 * - 개행으로 명령을 이어붙이는 패턴
 * - 백틱·마크다운 코드블록으로 컨텍스트 탈출
 * - "system:", "assistant:" 같은 역할 토큰 주입
 * - 길이 초과로 프롬프트 버퍼를 포화시키는 패턴
 */
export function sanitizeForPrompt(value: string, maxLen = 50): string {
  return value
    .replace(/[\r\n]/g, " ")                          // 개행 → 공백
    .replace(/`/g, "'")                               // 백틱 → 작은따옴표
    .replace(/\b(system|assistant|user|human)\s*:/gi, (m) =>   // 역할 토큰 무력화
      m.replace(":", "："))                            // 전각 콜론으로 교체
    .slice(0, maxLen)
    .trim();
}

/**
 * 외부 입력이 명령으로 처리되지 않도록 데이터 출처를 명시하는 래퍼 레이블.
 * 사용: `[DATA:contact_name] ${sanitizeForPrompt(name)}`
 */
export function labelAsData(field: string, value: string): string {
  return `[DATA:${field}] ${sanitizeForPrompt(value)}`;
}
