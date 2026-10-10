import { NextRequest, NextResponse } from 'next/server'
import {
  forbidden,
  getCommunityMember,
  imagePathsAllowed,
  parsePostInput,
  publicName,
  readJson,
  resolveAuthor,
} from '@/lib/community-server'
import { isCommunityCategory, type CommunityPostListItem } from '@/lib/community'

const PAGE_SIZE = 20

// 글 목록 (카테고리 필터 + 페이지)
export async function GET(req: NextRequest) {
  const res = await getCommunityMember()
  if (!res.ok) return forbidden(res.status)
  const { service } = res.member

  const category = req.nextUrl.searchParams.get('category')
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)
  const from = (page - 1) * PAGE_SIZE

  let query = service
    .from('community_posts')
    .select('id, category, title, author_display_name, is_anonymous, image_paths, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (isCommunityCategory(category)) query = query.eq('category', category)

  const { data, count, error } = await query
  if (error) {
    console.error(error)
    return NextResponse.json({ error: '글 목록을 불러오지 못했습니다.' }, { status: 500 })
  }

  const rows = (data ?? []) as {
    id: string
    category: CommunityPostListItem['category']
    title: string
    author_display_name: string
    is_anonymous: boolean
    image_paths: string[]
    created_at: string
  }[]

  // 댓글 수 집계 (글마다 개수만 조회)
  const commentCounts: Record<string, number> = {}
  await Promise.all(
    rows.map(async (r) => {
      const { count: c } = await service
        .from('community_comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', r.id)
      commentCounts[r.id] = c ?? 0
    })
  )

  const posts: CommunityPostListItem[] = rows.map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    authorName: publicName(r),
    createdAt: r.created_at,
    commentCount: commentCounts[r.id] ?? 0,
    hasImages: (r.image_paths?.length ?? 0) > 0,
  }))

  return NextResponse.json({
    posts,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  })
}

// 글쓰기
export async function POST(req: NextRequest) {
  const res = await getCommunityMember()
  if (!res.ok) return forbidden(res.status)
  const { member } = res

  const body = await readJson(req)
  const parsed = parsePostInput(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (!(await imagePathsAllowed(member, parsed.imagePaths))) {
    return NextResponse.json({ error: '첨부할 수 없는 이미지가 있습니다.' }, { status: 400 })
  }

  const author = resolveAuthor(member, body.identity, parsed.isAnonymous)
  if (!author) return NextResponse.json({ error: '작성자 정보를 확인할 수 없습니다.' }, { status: 400 })

  const { data, error } = await member.service
    .from('community_posts')
    .insert({
      category: parsed.category,
      title: parsed.title,
      body: parsed.body,
      image_paths: parsed.imagePaths,
      author_email: member.email,
      author_provider_id: author.providerId,
      author_display_name: author.displayName,
      is_anonymous: parsed.isAnonymous,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error(error)
    return NextResponse.json({ error: '글 등록에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
