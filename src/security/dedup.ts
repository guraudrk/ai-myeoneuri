/**
 * 동일 requestId + actionType 조합의 중복 실행을 차단한다.
 * 앱 세션 내 메모리 기반. 재시작 시 초기화.
 */
const executedActions = new Set<string>();

function makeKey(requestId: string, actionType: string): string {
  return `${requestId}::${actionType}`;
}

export function isDuplicate(requestId: string, actionType: string): boolean {
  return executedActions.has(makeKey(requestId, actionType));
}

export function markExecuted(requestId: string, actionType: string): void {
  executedActions.add(makeKey(requestId, actionType));
}

/** 테스트에서 초기화용 */
export function _resetForTest(): void {
  executedActions.clear();
}
