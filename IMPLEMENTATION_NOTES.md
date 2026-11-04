# PopoCarry 직접 수정 — 2026-10-28

실제 프로젝트: C:/popocarry. 기존 코드와 스키마는 별도 작업 폴더의 popocarry-before-20261028-154201에 백업했다. 당시 prisma 디렉터리에는 DB 파일이 없었다. 기존 소스가 요구하던 생성된 Prisma 클라이언트도 없었다. 샘플 레코드를 생성하지 않는 SQLite DB를 새로 초기화했다. .env.local의 기존 비밀값은 변경하지 않고 없던 DATABASE_URL만 추가했다.

## 변경
- Stripe 패키지와 SDK 호출, 모의 결제 모달 제거. 남은 옛 API는 410만 반환하며 외부 호출/DB 변경 없음.
- 여권 입력 UI/API 수집 제거. 기존 Passport 테이블은 보존하고 기본값은 미검증. 공개 API에서 여권·비밀번호 해시·계좌 제외.
- 실제 비밀번호 해시 검증과 NextAuth 세션, 조건부 Google/Kakao OAuth. 동일 이메일 계정을 자동 병합하지 않음. 공급자 실로그인은 미검증.
- 실제 주문/제안/프로필/채팅 저장 및 참여자 권한 검사. 원문 PIN은 공개 주문 DTO, 여행자 응답, 채팅에 포함하지 않음.
- 서버 PIN 검증, 5회 실패 잠금, 30일 만료, 재사용 방지, 암호화 저장. 수령 완료 후 PAYOUT_PENDING이며 송금을 주장하지 않음.
- 비공개 영수증 저장과 참여자 조회, 형식/용량 검사. 기존 공개 receipts URL은 410으로 차단하고 파일은 보존.
- Toss 결제 시도 ID, 서버 금액 계산, 소유권 확인, 중복 처리, 승인 후 DB 반영 실패 시 재조회 가능한 PROCESSING 상태. 테스트 키만 허용.
- 환불 요청은 REFUND_REQUESTED로 접수. 실제 환불·정산 완료 기록을 임의 생성하지 않음.
- 가짜 사용자·주문·평점 제거. teal 디자인을 유지하면서 모바일 내비게이션, 상품 검색, 내 거래, 폼, 상태/오류 표시 재구성. URL query로 화면/거래를 유지하므로 새로고침·뒤로가기 가능.
- Prisma CLI/client 6.19.0 통일. Next.js 15.5.28 및 수정된 빌드 의존성으로 정리. TypeScript strict=true.

## 실행 및 검증
- npm run typecheck
- PowerShell: `$env:NEXT_BUILD_DIR='.next-review'; npm run build`
- PowerShell: `$env:NEXT_BUILD_DIR='.next-review'; npm run start -- -p 3000 -H 127.0.0.1`
- node scripts/verify-local.cjs : 별도 QA DB/3105 서버, 토스 네트워크를 프로세스 내 모의 응답으로 대체. 실제 공급자 호출 없음. 결과: VERIFICATION_CURRENT.json.
- QA 기록은 qa-check-*에 격리되어 있으며 실제 서비스 DB와 섞이지 않음.
- Prisma CLI는 .env.local을 자동 읽지 않으므로 직접 실행 시 DATABASE_URL을 환경에 설정하거나 @next/env로 로드할 것.

## 아직 운영 준비가 필요한 부분
- Toss 실제 계정 테스트, 에스크로 계약 및 지급대행/자동 환불 연동은 미완료. 실결제를 코드에서 차단한 상태. 일반 카드 승인을 에스크로라고 표현하지 않음.
- REFUND_REQUESTED/DISPUTED/PAYOUT_PENDING 처리를 위한 운영자 대시보드·알림·정산 실행은 미구현. 접수 상태는 DB/거래실에 저장되지만 외부 통지는 없음.
- 본인확인 제공업체·정산 계좌 검증, 약관/개인정보/금지품목·통관 책임과 운영 정책 확정 필요. 초기 여권 수집은 하지 않음.
- 계정 복구/이메일 인증 미구현. 실제 Google/Kakao 로그인은 공급자 키·콜백 설정 후 별도 검증 필요.
- 목록/채팅은 각각 100/200개 상한과 수동 새로고침. 다국어, 고급 필터, 페이지네이션, 실시간 채팅은 후속 작업.
- 로그인/요청 속도 제한은 단일 Node 프로세스 메모리 기준. 다중 인스턴스 운영 전 공유 저장소 기반 제한 필요.
- PIN 만료/잠금 후 운영자 복구 정책 필요. 결제 승인 실패 후 PROCESSING 조정도 운영자 대사 흐름이 필요할 수 있음.
- 영수증 내용 진위나 상품 진품 여부를 자동 검증하지 않음. 파일 헤더/MIME/용량과 접근 권한만 검사.
- 브라우저 도구 연결이 종료되어 수정 후 화면 스크린샷과 실제 모바일 렌더링 검수는 수행하지 못함. HTTP/빌드/API 검증과 구분할 것.

공식 결제 API 참고: https://docs.tosspayments.com/reference

## 디자인 복원 — 2026-10-29
사용자 요청에 따라 원본 JSX에서 헤더·히어로·이용방법·상품 카드·주문 폼·프로필·거래실 디자인과 한/영 전환을 복원했다. 추가했던 서비스 준비 안내 배너와 푸터 문구를 제거했다. 기능 API는 유지하고 기존 입력/버튼에 연결했다. 수취 계좌는 사용자별 암호화 저장 및 마스킹 조회로 연결했다. TypeScript와 빌드 및 API 통합 검사 64개 통과. 히어로·이용방법·안전 섹션의 마크업과 클래스가 원본과 동일함을 비교했다. 실제 브라우저 렌더링 검수는 도구 연결 중단으로 수행하지 못했다. 현재 실행 빌드는 .next-design이며 일반 npm run dev 또는 새 빌드에서 후속 수정할 수 있다.


## 2026-10-29 payment follow-up
Signup work paused by user. Active build: .next-payments. Added failure/cancellation return page, provider-confirmed ABORTED/EXPIRED attempt retirement and fresh attempt creation, current order status on approval replay. Existing design verified. 74 isolated integration checks passed (Toss mocked). Read-only official Toss API probe returned 401 UNAUTHORIZED_KEY for current test key; actual approval unverified. Refund execution, payout integration and operational dashboard remain incomplete. Chat auto-refresh already implemented; older manual-refresh-only note is superseded.

## 2026-10-30 chat history
Toss and social login work deferred by user. Active build .next-history. Added participant-only cursor history API, earlier-message button, viewer-relative message alignment, near-bottom scroll following, input length and blank guards, order-change draft reset and response guards. Main original layout verification passed. Build and 83 isolated integration checks passed; browser visual/scroll behavior not verified. Other operational/admin and payment work remains pending.
