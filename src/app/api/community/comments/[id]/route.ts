import { NextRequest, NextResponse } from 'next/server'
import { forbidden, getCommunityMember } from '@/lib/community-server'

// 댓글 삭제 (작성자 본인 또는 관리자)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const res = await getCommunityMember()
  if (!res.ok) return forbidden(res.status)
  const { member } = res

  const { data: existing } = await member.service
    .from('community_comments')
    .select('author_email')
    .eq('id', id)
    .maybeSingle()
  if (!existing) return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
  if (existing.author_email !== member.email && !member.isAdmin) {
    return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
  }

  const { error } = await member.service.from('community_comments').delete().eq('id', id)
  if (error) {
    console.error(error)
    return NextResponse.json({ error: '댓글 삭제에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
