# 권한 매핑표

versionCode 49 기준. Play Store 심사 시 이 문서를 "권한 사용 목적" 설명 자료로 사용한다.

---

## 현재 선언된 권한

| 권한 | 사용 기능 | 필요 이유 | 런타임 요청 여부 | Play 정책 위험도 |
|---|---|---|---|---|
| `ACCESS_COARSE_LOCATION` | 업체 검색 | 반경 내 병원·약국·관공서 검색 (expo-location) | 예 (기능 사용 시) | 낮음 |
| `ACCESS_FINE_LOCATION` | 업체 검색 | expo-location 플러그인이 COARSE와 함께 선언 | 예 (기능 사용 시) | 낮음 |
| `CAMERA` | B-9 종이 읽어주기 | 사진 촬영 후 Gemini OCR | 예 (기능 사용 시) | 낮음 |
| `RECEIVE_SMS` | F2-2 스팸 의심 문자 탐지 | 수신 SMS 온디바이스 분류. 원문 서버 미전송 | 예 (기능 사용 시) | **높음 — Play 선언 필요** |
| `READ_PHONE_STATE` | F2-1 발신자 확인 | 수신 전화 번호 감지. 녹음 없음 | 예 (기능 사용 시) | 중간 |
| `INTERNET` | Supabase, Gemini API | 서버 통신 전반 | 없음 (일반 권한) | 낮음 |
| `READ_CONTACTS` | 음성 연락처 검색, F2-1 | 저장된 번호 대조 | 예 (기능 사용 시) | 낮음 |
| `RECORD_AUDIO` | 음성 인식, F2-3 통화 경보 | STT (SpeechRecognizer 로컬 인식) | 예 (앱 시작 시) | 낮음 |
| `RECEIVE_BOOT_COMPLETED` | F4 매일 알림 | 기기 재부팅 후 알림 재예약 | 없음 (일반 권한) | 낮음 |
| `SCHEDULE_EXACT_ALARM` | F4 매일 알림 | 정시 알림 (Android 12+) | 특수 접근 (설정 화면) | 중간 |
| `USE_EXACT_ALARM` | F4 매일 알림 | 정시 알림 (Android 13+) | 없음 (일반 권한) | 낮음 |
| `VIBRATE` | F2-3 통화 경보 | 위험 키워드 감지 시 진동 | 없음 (일반 권한) | 낮음 |
| `POST_NOTIFICATIONS` | F4 알림, F2 경보 | 알림 표시 (Android 13+) | 예 (앱 시작 시) | 낮음 |
| `READ_EXTERNAL_STORAGE` | B-9 (구형 Android) | expo-image-picker 구형 단말 호환 | 예 (기능 사용 시) | 낮음 |

---

## versionCode 49에서 제거된 권한

| 권한 | 제거 이유 | ADR |
|---|---|---|
| `PACKAGE_USAGE_STATS` | B-8 기능을 1차 출시에서 제외 (오너 결정 2026-08-20) | — |
| `SYSTEM_ALERT_WINDOW` | 코드에서 실제 사용 없음 (오버레이 미구현) | — |
| `WRITE_CONTACTS` | 코드에서 실제 사용 없음 (연락처 쓰기 기능 없음) | — |
| `WRITE_EXTERNAL_STORAGE` | 코드에서 실제 사용 없음, Android 10+에서는 불필요 | — |

---

## Play Store 선언 필요 권한

### RECEIVE_SMS (제한 권한)

**카테고리:** Caller ID or spam detection app  
**사용 목적:** 수신 SMS를 기기 내에서만 분류해 스팸·사기 문자를 감지합니다. 문자 원문은 서버로 전송하지 않습니다.  
**영어 설명 초안:** `docs/PLAY_DECLARATION_DRAFT.md` 참고

### READ_CALL_LOG (미선언, 향후 F2 확장 시 필요)

현재는 선언하지 않는다. 차단 기능 추가 시 별도 검토.

---

## 주의 사항

- `SCHEDULE_EXACT_ALARM` (Android 12+): 앱이 알람 시계 앱이 아니므로 사용자가 직접 설정 화면에서 허용해야 한다. 권한 거부 시 F4 알림이 ±수분 오차로 동작한다 (수용 가능).
- `READ_EXTERNAL_STORAGE`: Android 13+에서는 자동 무시된다. 구형 단말 (API 32 이하) 호환 목적.
