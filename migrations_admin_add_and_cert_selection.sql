-- 1) 센터장이 가입 시 "보유 자격증 전체 체크" + "대표 자격 1개 선택" 하도록 지원
alter table verification_requests
  add column if not exists claimed_certifications text[],
  add column if not exists representative_certification text;

-- 2) providers.source에 관리자가 직접 등록한 센터를 구분하는 값 추가
--    (컬럼이 text라면 별도 제약 없이 'admin_added' 값을 그대로 넣으면 됩니다.
--     혹시 CHECK 제약이 걸려있다면 아래 주석을 해제해서 허용값을 넓혀주세요.)
-- alter table providers drop constraint if exists providers_source_check;
-- alter table providers add constraint providers_source_check
--   check (source in ('imported_list', 'self_registered', 'admin_added'));
