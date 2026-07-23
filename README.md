# ABOUT 심리상담센터 — 온라인 상담계약서

상담계약서 + 생명존중서약서를 온라인에서 작성하고 전자서명까지 받는 독립 웹앱입니다.

## 화면 구성

- `/login` — 상담자 로그인 (공용 비밀번호)
- `/send` — 상담자가 지점/이름/급수/내담자 정보 입력 + 서명 후 내담자용 링크 생성
- `/form/[id]` — 내담자가 접속해 나머지 항목을 채우고 서명 후 제출 (로그인 불필요, 링크만 있으면 접속 가능)
- `/admin` — 발송/작성완료 목록, 검색·필터, 페이지네이션
- `/admin/[id]` — 개별 계약서 확인, 인쇄(PDF 저장), 삭제

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

- **서약자 서명(생명존중서약서) / 내담자 서명(상담계약서)은 완전히 분리되어 있습니다.** 문서 안의 각 "(클릭하여 서명)" 영역을 누르면 팝업이 뜨고, 그 안에서만 서명해서 저장합니다.
- **자동 이메일 발송은 EmailJS로 구현되어 있습니다.** (Resend는 보내는 도메인을 직접 인증해야 아무 이메일 주소로나 보낼 수 있어서 설정이 까다로운데, EmailJS는 브라우저에서 바로 보내는 방식이라 도메인 인증 없이 훨씬 간단합니다.)
  1. emailjs.com 무료 가입
  2. **Email Services**에서 Gmail 등 본인 메일 계정 연결 → Service ID 확인
  3. **Email Templates**에서 새 템플릿 생성. 템플릿 내용에 `{{to_name}}`, `{{link}}`, `{{counselor_name}}`, `{{branch}}` 변수를 자유롭게 배치하고, 받는 사람 필드에 `{{to_email}}` 지정 → Template ID 확인
  4. **Account > General**에서 Public Key 확인
  5. Vercel 환경변수에 `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` 추가 후 재배포
  - 설정 전이거나 발송 실패 시에도 링크 복사 / 메일 앱으로 보내기 버튼은 항상 그대로 남아있어 수동 전달이 가능합니다.
- **로그인은 상담자 전체가 공용 비밀번호 하나를 씁니다.** 개별 계정 구분은 하지 않습니다. (기존 근무표 앱과 동일한 방식)
- **연락처1·2는 필수, 연락처3은 선택**으로 만들었습니다 (원본 문서에서 1·2번만 노란 강조 표시가 되어 있어서요).
- 내담자가 제출을 완료하면 그 링크는 읽기 전용으로 바뀌고, 서버(DB) 단에서도 더 이상 수정되지 않도록 막아뒀습니다.
- 목록 페이지는 15건씩 페이지를 나눠서 보여줍니다.

## 이미 예전 버전을 배포하신 분들을 위한 마이그레이션 SQL

새로 처음 배포하신다면 `supabase-schema.sql`을 그대로 실행하면 되고, 아래는 이미 배포된 상태에서 순차적으로 기능이 추가된 경우에만 필요합니다. Supabase SQL Editor에서 실행하세요.

```sql
-- 1) 제출(update) 시 RLS 위반 에러가 났던 경우
drop policy if exists "only sent rows can be updated" on contracts;
create policy "only sent rows can be updated" on contracts for update using (status = 'sent') with check (true);

-- 2) 서약자 서명을 내담자 서명과 분리하기 전 버전이었던 경우
alter table contracts add column if not exists pledge_signature text;

-- 3) 삭제 기능을 쓰기 전 버전이었던 경우
drop policy if exists "anyone can delete" on contracts;
create policy "anyone can delete" on contracts for delete using (true);
```
