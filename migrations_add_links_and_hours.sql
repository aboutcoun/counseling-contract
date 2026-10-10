-- URL 여러 개(카테고리별) 저장용 테이블
create table provider_links (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) not null,
  category text not null, -- 일반/블로그/인스타그램/유튜브/카페/예약/밴드/페이스북/스마트스토어
  url text not null,
  sort_order int not null default 0
);

alter table provider_links enable row level security;

create policy "누구나 링크 조회 가능"
on provider_links for select
to anon, authenticated
using (true);

create policy "본인 센터만 링크 관리 가능"
on provider_links for all
to authenticated
using (
  provider_id in (select provider_id from provider_accounts where email = auth.jwt() ->> 'email')
);

-- 영업시간 구조화 저장 (요일 패턴 + 휴게시간)
alter table providers add column operating_hours_detail jsonb;
