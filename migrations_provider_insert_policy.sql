-- 방문자가 "직접 등록할게요"로 새 센터(미가입 상태)를 만들 수 있도록 허용
create policy "누구나 신규 센터(미가입) 등록 가능"
on providers for insert
to anon, authenticated
with check (status = 'unclaimed' and source = 'self_registered');
