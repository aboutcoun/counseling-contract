# counseling-directory

인증 심리상담센터 지도 서비스 — MVP 뼈대

## 처음 설정하기

1. 의존성 설치
```bash
npm install
```

2. 환경변수 설정
`.env.local.example`을 복사해 `.env.local`을 만들고 값을 채워주세요.

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  → Supabase (counseling_contract 프로젝트) 대시보드 → Project Settings → API 에서 확인
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`, `NAVER_MAP_CLIENT_SECRET`
  → 네이버 클라우드 플랫폼 → Maps → Application 에서 확인

3. 로컬 실행
```bash
npm run dev
```
http://localhost:3000 에서 확인

## 폴더 구조

- `src/app/page.tsx` — 지도+리스트 메인 페이지 (인증 센터만 노출)
- `src/app/centers/[id]/page.tsx` — 센터 상세 페이지
- `src/app/join/` — 가입/인증 플로우 (센터 찾기 → 계정생성 → 기본정보 → 프로그램/가격 → 자격증빙)
- `src/app/mypage/` — 센터 계정 마이페이지 (신청 현황, 반려 사유, 정보 수정)
- `src/app/login/` — 기존 센터 계정 로그인
- `src/lib/supabase/` — Supabase 클라이언트 (브라우저용 / 서버용 / Service Role용)
- `src/lib/naver-geocode.ts`, `src/app/api/geocode/` — 주소→좌표 변환 (서버에서만 Client Secret 사용)
- `src/components/CenterMap.tsx` — 네이버 지도 마커 표시 컴포넌트

## 아직 만들지 않은 것 (다음 단계)

- 관리자 승인 대시보드 (verification_requests 검토, 승인/반려+사유 입력) — Service Role 클라이언트(createServiceRoleClient)를 이용해 서버 라우트로 구현 필요
- 리스트에 없는 센터를 위한 사전 시드 데이터 import 스크립트 (확보하신 서울·경기 리스트를 providers 테이블에 source='imported_list', status='unclaimed'로 미리 넣는 작업)
- 리뷰 시스템 (이번 MVP 범위에서 제외, 스마트플레이스 아웃링크로 대체)

## 배포

Vercel에 이 저장소를 연결하고, 위 환경변수를 Vercel 프로젝트 설정의 Environment Variables에 동일하게 등록하면 됩니다.
