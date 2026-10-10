import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

// 관리자가 센터장 계정(이메일)으로 비밀번호 재설정 메일을 대신 보내줍니다.
// 아이디(이메일)나 비밀번호를 잊어버렸다는 문의가 들어올 때, 관리자가 이 계정이 맞는지
// 확인해주고 재설정 메일까지 즉시 보내줄 수 있도록 하기 위함입니다.
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
  }

  const { email }: { email?: string } = await req.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const origin = req.nextUrl.origin

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message ?? '메일 발송에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
