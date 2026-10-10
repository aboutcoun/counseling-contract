import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// 로그인한 센터장 본인의 안읽은 메시지를 읽음 처리합니다.
// body에 messageIds가 있으면 그 메시지만, 없으면 본인 센터의 모든 메시지를 처리합니다.
export async function POST(req: NextRequest) {
  let messageIds: string[] | undefined
  try {
    const body = await req.json()
    if (Array.isArray(body?.messageIds)) messageIds = body.messageIds
  } catch {
    // body 없이 호출된 경우 — 전체 읽음 처리
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const service = createServiceRoleClient()
  const { data: accounts } = await service
    .from('provider_accounts')
    .select('provider_id')
    .eq('email', user.email)

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ error: '연결된 센터를 찾을 수 없습니다.' }, { status: 404 })
  }

  const providerIds = accounts.map((a: { provider_id: string }) => a.provider_id)

  let query = service
    .from('provider_messages')
    .update({ read_at: new Date().toISOString() })
    .in('provider_id', providerIds)
    .is('read_at', null)
  if (messageIds && messageIds.length > 0) query = query.in('id', messageIds)

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
