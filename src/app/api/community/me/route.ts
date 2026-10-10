import { NextResponse } from 'next/server'
import { getCommunityMember } from '@/lib/community-server'

// 커뮤니티 이용 가능 여부와, 글쓰기 때 고를 수 있는 이름 목록
export async function GET() {
  const res = await getCommunityMember()
  if (!res.ok) {
    return NextResponse.json({ allowed: false, reason: res.status === 401 ? 'login' : 'not_approved' })
  }
  return NextResponse.json({
    allowed: true,
    isAdmin: res.member.isAdmin,
    identities: res.member.identities,
  })
}
