import { NextRequest, NextResponse } from 'next/server'
import { forbidden, getCommunityMember, readJson, resolveAuthor } from '@/lib/community-server'

// 댓글 쓰기
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const res = await getCommunityMember()
  if (!res.ok) return forbidden(res.status)
  const { member } = res

  const body = await readJson(req)
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!text) return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
  if (text.length > 2000) {
    return NextResponse.json({ error: '댓글은 2,000자 이내로 입력해주세요.' }, { status: 400 })
  }

  const isAnonymous = !!body.isAnonymous
  const author = resolveAuthor(member, body.identity, isAnonymous)
  if (!author) return NextResponse.json({ error: '작성자 정보를 확인할 수 없습니다.' }, { status: 400 })

  const { data: post } = await member.service
    .from('community_posts')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (!post) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })

  const { error } = await member.service.from('community_comments').insert({
    post_id: id,
    body: text,
    author_email: member.email,
    author_provider_id: author.providerId,
    author_display_name: author.displayName,
    is_anonymous: isAnonymous,
  })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: '댓글 등록에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
