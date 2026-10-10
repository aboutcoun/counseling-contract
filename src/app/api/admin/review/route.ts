import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
  }

  const { requestId, providerId, action, reason, certifications } = await req.json()

  if (!requestId || !providerId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }
  if (action === 'reject' && !reason) {
    return NextResponse.json({ error: '반려 사유가 필요합니다.' }, { status: 400 })
  }
  if (action === 'approve' && (!Array.isArray(certifications) || certifications.length === 0)) {
    return NextResponse.json({ error: '증빙된 자격증을 최소 1개 선택해주세요.' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()

  let operatorDisplayName: string | null = null
  let degreeField: string | null = null
  if (action === 'approve') {
    const { data: owner } = await supabase
      .from('provider_owners')
      .select('actual_operator_name')
      .eq('provider_id', providerId)
      .maybeSingle()
    operatorDisplayName = owner?.actual_operator_name ?? null

    const { data: reqRow } = await supabase
      .from('verification_requests')
      .select('degree_field')
      .eq('id', requestId)
      .maybeSingle()
    degreeField = reqRow?.degree_field ?? null
  }

  const { error: reqError } = await supabase
    .from('verification_requests')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      rejection_reason: action === 'reject' ? reason : null,
      reviewed_at: now,
    })
    .eq('id', requestId)

  if (reqError) {
    return NextResponse.json({ error: reqError.message }, { status: 500 })
  }

  const { error: providerError } = await supabase
    .from('providers')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      verified_certifications: action === 'approve' ? certifications : null,
      operator_display_name: action === 'approve' ? operatorDisplayName : null,
      degree_field: action === 'approve' ? degreeField : null,
    })
    .eq('id', providerId)

  if (providerError) {
    return NextResponse.json({ error: providerError.message }, { status: 500 })
  }

  // 센터장 마이페이지 메시지함에 결과를 남깁니다.
  const messageBody =
    action === 'approve'
      ? '인증 신청이 승인되었습니다. 지도에 인증 배지가 표시됩니다.'
      : `인증 신청이 반려되었습니다.\n\n반려 사유: ${reason}\n\n마이페이지에서 서류를 다시 제출해주세요.`

  const { error: messageError } = await supabase.from('provider_messages').insert({
    provider_id: providerId,
    body: messageBody,
  })
  if (messageError) {
    console.error('메시지 저장 실패:', messageError)
  }

  return NextResponse.json({ ok: true })
}
