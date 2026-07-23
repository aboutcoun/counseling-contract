-- Supabase SQL Editor에 그대로 붙여넣어 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  branch text not null,
  counselor_name text not null,
  counselor_level text not null,
  counselor_signature text not null,
  client_name text not null,
  client_email text not null,
  status text not null default 'sent', -- 'sent' | 'completed'
  contact1_phone text,
  contact1_relation text,
  contact2_phone text,
  contact2_relation text,
  contact3_phone text,
  contact3_relation text,
  client_signature text,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table contracts enable row level security;

-- 발송 페이지(상담자)에서 새 계약서를 만들 수 있도록 허용
create policy "anyone can insert" on contracts
  for insert
  with check (true);

-- 목록/조회 페이지와 내담자 작성 페이지 모두 조회 가능해야 하므로 허용
create policy "anyone can select" on contracts
  for select
  using (true);

-- 내담자가 '발송됨' 상태일 때만 자신의 응답을 채워 넣을 수 있도록 제한
-- (이미 제출 완료된 계약서는 더 이상 수정할 수 없음)
create policy "only sent rows can be updated" on contracts
  for update
  using (status = 'sent');
