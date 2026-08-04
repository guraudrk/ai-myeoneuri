/**
 * 연락처 이름·검색 결과 등 외부 데이터를 일반 문자열로만 처리한다.
 * 이 함수는 LLM 프롬프트에 외부 값을 포함할 때 래핑용으로 사용한다.
 *
 * 지시어로 오해될 수 있는 패턴을 제거하지 않고 데이터 컨텍스트를 명확히 한다.
 * 실제 LLM 호출 시 system prompt에 "[DATA]" 섹션을 분리해야 한다.
 */
export function sanitizeForPrompt(value: string): string {
  // 실제 실행에 영향을 줄 수 없는 data-only 섹션임을 보장.
  // 현재는 값을 그대로 반환하되, 호출자가 system/user 분리를 지켜야 함.
  return value;
}

/**
 * 연락처 이름처럼 외부 입력이 명령으로 처리되지 않도록
 * 데이터 출처를 명시하는 래퍼 레이블을 반환한다.
 */
export function labelAsData(field: string, value: string): string {
  return `[DATA:${field}] ${value}`;
}
