-- 예전에 바우처 목록으로 일괄 임포트했던 센터(source = 'imported_list')를 전부 삭제합니다.
-- 실행 전, 혹시 그중 이미 센터장이 클레임했거나(계정 연결) 승인까지 된 곳이 있는지 먼저 확인하세요.

-- 1) 안전 확인: 클레임되었거나(provider_accounts 존재) 이미 승인된 imported_list 센터가 있는지 확인
--    결과가 0건이면 안심하고 2)를 실행하면 됩니다.
--    결과가 있다면 해당 센터는 아래 일괄삭제에서 제외하고 싶은지 먼저 판단해주세요.
select p.id, p.name, p.status, (pa.provider_id is not null) as has_claimed_account
from providers p
left join provider_accounts pa on pa.provider_id = p.id
where p.source = 'imported_list'
  and (p.status = 'approved' or pa.provider_id is not null);

-- 2) 일괄 삭제 실행 (연결된 하위 데이터부터 순서대로 삭제 후 providers 삭제)
delete from provider_programs
  where provider_id in (select id from providers where source = 'imported_list');

delete from provider_links
  where provider_id in (select id from providers where source = 'imported_list');

delete from provider_owners
  where provider_id in (select id from providers where source = 'imported_list');

delete from verification_requests
  where provider_id in (select id from providers where source = 'imported_list');

delete from provider_accounts
  where provider_id in (select id from providers where source = 'imported_list');

delete from providers
  where source = 'imported_list';
