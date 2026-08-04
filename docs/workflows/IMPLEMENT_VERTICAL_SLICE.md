# Workflow — Implement Vertical Slice

## Trigger

사용자가 새로운 기능, 수정 또는 다음 최우선 Task 진행을 요청했을 때.

## Inputs

- 최신 사용자 지시
- `CLAUDE.md`
- `00_PROJECT_HANDOFF_AND_ROADMAP.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/DECISIONS.md`
- 관련 Product/Architecture/Design 문서
- 현재 Git status와 코드·테스트

## Preconditions

- 현재 작업 디렉터리가 `ai-myeoneuri`인지 확인
- 기존 미커밋 변경 확인
- 승인 Gate 여부 확인
- 실제 실행·검증 명령 확인

## Steps

### 1. Discover

- 관련 진입점, 타입, UI, Adapter, Test만 검색
- 이미 구현됐는지 확인
- 문서와 코드 충돌 확인
- 전체 저장소를 무작정 읽지 않음

### 2. Define

Task Contract:

```text
Objective:
Success criteria:
In scope:
Out of scope:
Constraints:
Risk level:
Likely files:
Validation:
Approval gates:
Stop conditions:
```

### 3. Plan

작은 Vertical Slice로 나눈다.

각 Step:

- Output
- Files
- Dependencies
- Risk
- Validation
- Rollback

### 4. Execute

- 한 번에 하나의 Active Task
- 작은 Diff
- 기존 Pattern
- 최소 Dependency
- UI와 Side Effect 분리
- 안전 정책과 확인을 우회하지 않음

### 5. Verify

순서:

1. 변경 파일 자체 검토
2. 관련 Unit Test
3. Type-check
4. Lint
5. Integration
6. Expo Doctor/Build
7. Android Native Build
8. 가능한 기기/Manual QA
9. Git diff
10. Acceptance Criteria
11. Secret check

### 6. Review

- 과도한 복잡성
- 불필요한 권한
- 개인정보
- 회귀
- 디자인 불일치
- 문서 불일치
- 사용하지 않는 새 코드

### 7. Record

- `IMPLEMENTATION_PLAN.md`
- `DECISIONS.md`
- `REUSE_MATRIX.md` 필요 시
- README
- Test
- Known limitations

### 8. Decide

- 다음 READY Task
- 오류 수정
- 승인 요청
- 완료 보고

## Failure handling

동일 오류 자동 재시도 1회, 자동 Repair 1회, 평가·수정 루프 최대 2회.

한도 도달 시:

- 첫 오류
- 시도한 수정
- 남은 원인
- 현재 안전 상태
- 필요한 승인 또는 다음 행동

을 보고한다.

## Stop conditions

- Acceptance Criteria 충족
- 승인 Gate
- Secret/개인정보 위험
- 파괴적 변경 필요
- 반복 한도 도달
- 접근 불가능한 필수 시스템
- 사용자 취소
