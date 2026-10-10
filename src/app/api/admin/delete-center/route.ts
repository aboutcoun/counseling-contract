import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
  }

  const { providerId }: { providerId?: string } = await req.json()
  if (!providerId) {
    return NextResponse.json({ error: 'providerId가 필요합니다.' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // 연결된 이메일 계정, 신청서, 프로그램, 링크, 대표자 정보를 먼저 정리한 뒤 센터를 삭제합니다.
  // (일부 테이블은 FK cascade가 없을 수 있어 순서대로 직접 지웁니다.)
  await supabase.from('provider_accounts').delete().eq('provider_id', providerId)
  await supabase.from('verification_requests').delete().eq('provider_id', providerId)
  await supabase.from('provider_owners').delete().eq('provider_id', providerId)
  await supabase.from('provider_programs').delete().eq('provider_id', providerId)
  await supabase.from('provider_links').delete().eq('provider_id', providerId)

  const { error } = await supabase.from('providers').delete().eq('id', providerId)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message ?? '센터 삭제에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
