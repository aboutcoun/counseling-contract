import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

// 관리자가 특정 센터(운영자)에게 쪽지를 보냅니다. 센터장은 마이페이지 메시지함에서 확인합니다.
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
  }

  const { providerId, body }: { providerId?: string; body?: string } = await req.json()
  if (!providerId || !body?.trim()) {
    return NextResponse.json({ error: '보낼 센터와 메시지 내용이 필요합니다.' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('provider_messages')
    .insert({ provider_id: providerId, body: body.trim() })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message ?? '메시지 전송에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
