import { NextRequest, NextResponse } from 'next/server'
import {
  forbidden,
  getCommunityMember,
  imagePathsAllowed,
  parsePostInput,
  publicName,
  readJson,
  removeImages,
  resolveAuthor,
  signImagePaths,
} from '@/lib/community-server'
import {
  ADMIN_IDENTITY,
  ANONYMOUS_NAME,
  type CommunityComment,
  type CommunityPostDetail,
} from '@/lib/community'

interface PostRow {
  id: string
  category: CommunityPostDetail['category']
  title: string
  body: string
  image_paths: string[]
  author_email: string
  author_provider_id: string | null
  author_display_name: string
  is_anonymous: boolean
  created_at: string
  updated_at: string | null
}

interface CommentRow {
  id: string
  body: string
  author_email: string
  author_display_name: string
  is_anonymous: boolean
  created_at: string
}

// 글 상세 + 댓글
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const res = await getCommunityMember()
  if (!res.ok) return forbidden(res.status)
  const { member } = res

  const { data: post } = await member.service
    .from('community_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!post) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
  const p = post as PostRow

  const { data: commentRows } = await member.service
    .from('community_comments')
    .select('id, body, author_email, author_display_name, is_anonymous, created_at')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  // 익명 댓글은 같은 글 안에서 사람마다 "익명1, 익명2…"로 구분해 보여줍니다.
  const anonNumbers = new Map<string, number>()
  const comments: CommunityComment[] = ((commentRows as CommentRow[]) ?? []).map((c) => {
    const sameAsPostAuthor = c.author_email === p.author_email
    // 익명 여부가 글과 같을 때만 "글쓴이" 표시 — 다르면 표시 자체가 익명성을 깨뜨리기 때문
    const isPostAuthor = sameAsPostAuthor && c.is_anonymous === p.is_anonymous

    let authorName = publicName(c)
    if (c.is_anonymous && !isPostAuthor) {
      if (!anonNumbers.has(c.author_email)) anonNumbers.set(c.author_email, anonNumbers.size + 1)
      authorName = `${ANONYMOUS_NAME}${anonNumbers.get(c.author_email)}`
    }

    const isMine = c.author_email === member.email
    return {
      id: c.id,
      body: c.body,
      authorName,
      isAnonymous: c.is_anonymous,
      isPostAuthor,
      isMine,
      canDelete: isMine || member.isAdmin,
      createdAt: c.created_at,
    }
  })

  const isMine = p.author_email === member.email
  const detail: CommunityPostDetail = {
    id: p.id,
    category: p.category,
    title: p.title,
    body: p.body,
    images: await signImagePaths(member.service, p.image_paths ?? []),
    authorName: publicName(p),
    isAnonymous: p.is_anonymous,
    authorIdentity: isMine ? p.author_provider_id ?? ADMIN_IDENTITY : null,
    isMine,
    canDelete: isMine || member.isAdmin,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    comments,
  }

  return NextResponse.json(detail)
}

// 글 수정 (작성자 본인만)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const res = await getCommunityMember()
  if (!res.ok) return forbidden(res.status)
  const { member } = res

  const { data: existing } = await member.service
    .from('community_posts')
    .select('author_email, image_paths, is_anonymous')
    .eq('id', id)
    .maybeSingle()
  if (!existing) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
  if (existing.author_email !== member.email) {
    return NextResponse.json({ error: '본인이 쓴 글만 수정할 수 있습니다.' }, { status: 403 })
  }

  const body = await readJson(req)
  const parsed = parsePostInput(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const existingPaths = (existing.image_paths as string[]) ?? []
  if (!(await imagePathsAllowed(member, parsed.imagePaths, existingPaths))) {
    return NextResponse.json({ error: '첨부할 수 없는 이미지가 있습니다.' }, { status: 400 })
  }

  // 익명 여부는 작성 후 바꿀 수 없습니다.
  // (바꾸면 "글쓴이" 표시가 달라지면서 익명 댓글의 작성자가 드러날 수 있기 때문)
  const isAnonymous = !!existing.is_anonymous

  const author = resolveAuthor(member, body.identity, isAnonymous)
  if (!author) return NextResponse.json({ error: '작성자 정보를 확인할 수 없습니다.' }, { status: 400 })

  const { error } = await member.service
    .from('community_posts')
    .update({
      category: parsed.category,
      title: parsed.title,
      body: parsed.body,
      image_paths: parsed.imagePaths,
      author_provider_id: author.providerId,
      author_display_name: author.displayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: '글 수정에 실패했습니다.' }, { status: 500 })
  }

  // 수정하면서 빠진 이미지는 저장소에서도 지웁니다.
  const removed = existingPaths.filter((p) => !parsed.imagePaths.includes(p))
  await removeImages(member.service, removed)

  return NextResponse.json({ ok: true })
}

// 글 삭제 (작성자 본인 또는 관리자)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const res = await getCommunityMember()
  if (!res.ok) return forbidden(res.status)
  const { member } = res

  const { data: existing } = await member.service
    .from('community_posts')
    .select('author_email, image_paths')
    .eq('id', id)
    .maybeSingle()
  if (!existing) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
  if (existing.author_email !== member.email && !member.isAdmin) {
    return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
  }

  const { error } = await member.service.from('community_posts').delete().eq('id', id)
  if (error) {
    console.error(error)
    return NextResponse.json({ error: '글 삭제에 실패했습니다.' }, { status: 500 })
  }
  await removeImages(member.service, (existing.image_paths as string[]) ?? [])

  return NextResponse.json({ ok: true })
}
