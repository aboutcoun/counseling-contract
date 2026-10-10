-- 센터장용 메시지함(안읽음 표시 가능) 기능 추가
-- 관리자가 승인/반려 처리할 때 센터장에게 자동으로 쪽지가 남습니다.

create extension if not exists pgcrypto;

create table if not exists provider_messages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists provider_messages_provider_id_idx
  on provider_messages (provider_id);

alter table provider_messages enable row level security;

-- 마이페이지에서 센터장이 자신의 메시지를 조회할 수 있도록 select는 열어둡니다.
-- (다른 테이블들과 동일하게, 조회는 provider_id를 아는 클라이언트에게 허용하고
--  실제 "내 메시지 읽음 처리"는 서버(관리자 권한/서비스 롤) API를 통해서만 이루어집니다.)
drop policy if exists "provider_messages_select_all" on provider_messages;
create policy "provider_messages_select_all" on provider_messages
  for select using (true);
