-- 상세페이지(비로그인 공개)에서 운영자명을 보여주기 위해 providers에 복사 저장
alter table providers add column operator_display_name text;
