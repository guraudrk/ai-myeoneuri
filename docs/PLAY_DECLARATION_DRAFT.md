# Play Console 권한 선언 초안

RECEIVE_SMS 제한 권한 신청 시 Play Console "앱 콘텐츠" 화면에 제출하는 설명 문서.
**영어로 작성해야 한다.** 200단어 이상 권장.

---

## RECEIVE_SMS 선언 (영어)

**Category:** Caller ID or spam detection app

**Justification (English, ~250 words):**

> AI Myeoneuri ("AI Daughter-in-Law") is a personal safety assistant app designed for elderly users whose adult children install it on their behalf. The app's core mission is to protect older adults — who represent the highest-risk demographic for phone fraud in South Korea — from spam messages and potential scam content.
>
> The RECEIVE_SMS permission is used exclusively for on-device spam detection. When a text message arrives, the app applies a local rule engine to identify patterns associated with spam or scam messages (e.g., impersonation of government agencies, unfamiliar short URLs, or unsolicited delivery notifications). This classification occurs entirely on the device. The content of any SMS message is never transmitted to any external server or stored beyond the immediate classification process.
>
> This functionality falls squarely within the "Caller ID or spam detection" use case defined by Google Play policy. The app does not read SMS for any other purpose, does not aggregate or share message content, and does not retain message text after classification. The classification result (risk level: low/medium/high) is displayed to the user as a local warning banner so they can make an informed decision before responding.
>
> Users can grant or deny this permission at any time. If the permission is denied, only the SMS spam detection feature is disabled; all other app features (voice assistant, caller ID, daily reminders) continue to function normally.
>
> We are committed to full compliance with Google Play's SMS and Call Log permissions policy and are happy to provide additional documentation or a demo upon request.

---

## 한국어 메모 (오너 검토용)

- "Caller ID or spam detection app" 카테고리로 신청 — track record 요건 없음
- 핵심 포인트 3가지를 반드시 포함해야 함:
  1. 온디바이스만 처리 (never transmitted to external server)
  2. SMS 원문 미저장 (not retained after classification)
  3. 권한 거부 시 다른 기능 정상 동작 (other features continue normally)
- 200단어 이상으로 제출해야 심사 통과 가능성 높음 (현재 약 250단어)
- 개인정보처리방침 URL이 있어야 이 선언이 유효함

---

## READ_CALL_LOG (미선언 — 향후 참고용)

현재 선언하지 않는다. 향후 통화 차단 기능(F2 확장) 추가 시:

> Category: Caller ID or spam detection app  
> The app uses READ_CALL_LOG to identify whether incoming calls originate from numbers associated with known fraud patterns, providing real-time caller identification warnings to elderly users. Call log data is processed on-device only and is not transmitted externally.

---

## 제출 체크리스트

```
[ ] Play Console > 앱 콘텐츠 > 민감한 앱 및 API 정책 > SMS 또는 통화 기록 접근 선언
[ ] 카테고리: "Caller ID or spam detection app" 선택
[ ] 위 영어 설명 붙여넣기
[ ] 개인정보처리방침 URL 입력
[ ] 저장 후 심사 제출
```
