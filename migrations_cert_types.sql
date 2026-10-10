-- 인증된 자격증 종류 저장 (관리자가 승인 시 선택)
alter table providers add column verified_certifications text[];
