-- 사업자등록증(1개), 자격증(여러 개) 컬럼 추가
alter table verification_requests add column business_reg_url text;
alter table verification_requests add column cert_file_urls text[];
-- 기존 cert_file_url(단일) 컬럼은 더 이상 사용하지 않지만 데이터 보존을 위해 남겨둡니다.

-- 프로그램 표시 순서 저장용
alter table provider_programs add column sort_order int not null default 0;
