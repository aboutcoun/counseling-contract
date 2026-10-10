-- 한 계정(이메일)이 여러 센터를 운영할 수 있도록 지원합니다.
-- 1) provider_accounts.email에 걸려있을 수 있는 단일 컬럼 unique 제약을 제거합니다
--    (이메일 하나로 여러 provider_id에 연결될 수 있어야 하기 때문).
do $$
declare
  conname text;
begin
  select con.conname into conname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
  where rel.relname = 'provider_accounts'
    and con.contype = 'u'
    and att.attname = 'email'
    and cardinality(con.conkey) = 1
  limit 1;

  if conname is not null then
    execute format('alter table provider_accounts drop constraint %I', conname);
  end if;
end $$;

-- 2) 대신 센터(provider_id) 하나에는 계정이 하나만 연결되도록 보장합니다.
do $$
begin
  alter table provider_accounts add constraint provider_accounts_provider_id_unique unique (provider_id);
exception when duplicate_object then null;
end $$;
