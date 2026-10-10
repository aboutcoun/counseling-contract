-- 센터장 커뮤니티 (구인구직 / 센터 인수·양도 / 정보공유 / 자유·고민)
-- 인증완료 센터장과 관리자만 이용할 수 있습니다.
-- 모든 읽기/쓰기는 서버 API(서비스 롤)를 거치므로, 테이블에는 공개 정책을 두지 않습니다.
-- (RLS만 켜두고 정책이 없으면 브라우저에서 직접 조회/수정이 불가능합니다)

create extension if not exists pgcrypto;

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('jobs', 'transfer', 'info', 'free')),
  title text not null,
  body text not null,
  image_paths text[] not null default '{}',
  author_email text not null,
  author_provider_id uuid references providers(id) on delete set null,
  author_display_name text not null,      -- 작성 시점의 표시 이름(센터명 또는 '안심상담맵 운영자')
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists community_posts_category_created_idx
  on community_posts (category, created_at desc);
create index if not exists community_posts_created_idx
  on community_posts (created_at desc);

create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  body text not null,
  author_email text not null,
  author_provider_id uuid references providers(id) on delete set null,
  author_display_name text not null,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx
  on community_comments (post_id, created_at);

-- 누가 어떤 이미지를 올렸는지 기록 (다른 사람이 올린 이미지를 자기 글에 끼워넣거나 지우지 못하게)
create table if not exists community_uploads (
  path text primary key,
  uploader_email text not null,
  created_at timestamptz not null default now()
);

alter table community_posts enable row level security;
alter table community_comments enable row level security;
alter table community_uploads enable row level security;

-- 첨부 이미지용 비공개 버킷 (장당 최대 5MB, 이미지 파일만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-images',
  'community-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
