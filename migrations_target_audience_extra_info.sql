-- '대상'(상담 가능 대상)과 '부가정보' 필드 추가
alter table providers add column if not exists target_audiences text[] not null default '{}';
alter table providers add column if not exists extra_info text[] not null default '{}';
