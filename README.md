# ABOUT 심리상담센터 — 온라인 상담계약서

상담계약서 + 생명존중서약서를 온라인에서 작성하고 전자서명까지 받는 독립 웹앱입니다.

## 화면 구성

- `/login` — 상담자 로그인 (공용 비밀번호)
- `/send` — 상담자가 지점/이름/급수/내담자 정보 입력 + 서명 후 내담자용 링크 생성
- `/form/[id]` — 내담자가 접속해 나머지 항목을 채우고 서명 후 제출 (로그인 불필요, 링크만 있으면 접속 가능)
- `/admin` — 발송/작성완료 목록, 검색·필터
- `/admin/[id]` — 개별 계약서 확인 및 인쇄(PDF 저장)

## 배포 방법 (Vercel + Supabase)

1. **Supabase 프로젝트 생성** → SQL Editor에서 `supabase-schema.sql` 내용을 그대로 실행
2. Supabase 프로젝트 설정 > API 에서 `Project URL`, `anon public key` 확인
3. 이 폴더를 GitHub 저장소로 올리기 (또는 Vercel CLI로 바로 배포)
4. Vercel에서 새 프로젝트로 이 저장소 연결
5. Vercel 프로젝트 Settings > Environment Variables 에 아래 값 추가
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD` (상담자들이 공용으로 쓸 비밀번호)
   - `SESSION_TOKEN` (아무 무작위 문자열, 예: 32자 랜덤 문자열)
6. Deploy

로컬에서 미리 보려면:

```bash
npm install
cp .env.example .env.local   # 값 채워넣기
npm run dev
```

## 알아두시면 좋은 점 (설계상 가정)

- **서명은 1회만 받습니다.** 생명존중서약서의 "서약자" 서명과 상담계약서의 "내담자" 서명에 동일한 서명 이미지를 사용합니다. 두 곳에 각각 다르게 서명받고 싶으시면 말씀해 주세요.
- **자동 이메일 발송은 EmailJS로 구현되어 있습니다.** (Resend는 보내는 도메인을 직접 인증해야 아무 이메일 주소로나 보낼 수 있어서 설정이 까다로운데, EmailJS는 브라우저에서 바로 보내는 방식이라 도메인 인증 없이 훨씬 간단합니다.)
  1. emailjs.com 무료 가입
  2. **Email Services**에서 Gmail 등 본인 메일 계정 연결 → Service ID 확인
  3. **Email Templates**에서 새 템플릿 생성. 템플릿 내용에 `{{to_name}}`, `{{link}}`, `{{counselor_name}}`, `{{branch}}` 변수를 자유롭게 배치하고, 받는 사람 필드에 `{{to_email}}` 지정 → Template ID 확인
  4. **Account > General**에서 Public Key 확인
  5. Vercel 환경변수에 `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` 추가 후 재배포
  - 설정 전이거나 발송 실패 시에도 링크 복사 / 메일 앱으로 보내기 버튼은 항상 그대로 남아있어 수동 전달이 가능합니다.
- **RLS 정책 관련:** 최초 배포 후 "new row violates row-level security policy" 에러가 났다면, `supabase-schema.sql`의 update 정책에 `with check (true)`가 빠져 있던 버전이라 그렇습니다. 이 zip의 `supabase-schema.sql`은 수정된 버전이니, Supabase SQL Editor에서 아래 한 줄만 다시 실행해 주세요.
    ```sql
    drop policy if exists "only sent rows can be updated" on contracts;
    create policy "only sent rows can be updated" on contracts for update using (status = 'sent') with check (true);
    ```
- **서약자 서명 / 내담자 서명이 이제 완전히 분리되었습니다.** 문서 안의 각 "(클릭하여 서명)" 영역을 누르면 팝업이 뜨고, 그 안에서만 서명해서 저장합니다. 기존에 이미 컬럼을 만드신 분들은(위 SQL을 이미 실행하셨다면) 아래 한 줄만 추가로 실행해 주세요.
    ```sql
    alter table contracts add column if not exists pledge_signature text;
    ```
- **로그인은 상담자 전체가 공용 비밀번호 하나를 씁니다.** 개별 계정 구분은 하지 않습니다. (기존 근무표 앱과 동일한 방식)
- **연락처1·2는 필수, 연락처3은 선택**으로 만들었습니다 (원본 문서에서 1·2번만 노란 강조 표시가 되어 있어서요).
- 내담자가 제출을 완료하면 그 링크는 읽기 전용으로 바뀌고, 서버(DB) 단에서도 더 이상 수정되지 않도록 막아뒀습니다.
