-- 1) 자격 증빙에 더해 "관련 분야 석사 이상 학력" 증빙 필드 추가
alter table verification_requests
  add column if not exists has_related_masters boolean,
  add column if not exists degree_field text,
  add column if not exists degree_file_url text;

-- 2) 센터장이 입력하는 "네이버 스마트플레이스에 등록된 업체명" 필드 추가
--    (관리자가 나중에 이 이름으로 실제 스마트플레이스를 찾아 URL을 매칭시키는 용도)
alter table providers
  add column if not exists naver_place_name text,
  add column if not exists degree_field text; -- 인증 승인 시 verification_requests.degree_field를 복사해 공개 표시용으로 저장

-- 참고: '보건복지부 정신건강임상심리사 2급' 자격 추가는 DB 스키마 변경이 필요 없고
-- src/lib/cert-types.ts 코드 수정만으로 반영됩니다.
-- 참고: 서비스명 변경('마음맵' → '안심상담맵')도 코드/문구 수정만으로 반영되며 DB 변경은 없습니다.

-- 3) 프로그램 가격 "별도문의" 지원
alter table provider_programs
  add column if not exists price_on_request boolean not null default false;
alter table provider_programs
  alter column price drop not null;
