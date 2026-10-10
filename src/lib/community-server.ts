// 서버 전용 (서비스 롤 키 사용) — 클라이언트 컴포넌트에서 import하지 마세요.
import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import {
  ADMIN_DISPLAY_NAME,
  ADMIN_IDENTITY,
  ANONYMOUS_NAME,
  COMMUNITY_BUCKET,
  isCommunityCategory,
  MAX_IMAGES_PER_POST,
  type CommunityIdentity,
} from '@/lib/community'

export interface CommunityMember {
  email: string
  isAdmin: boolean
  /** 이 계정으로 글을 쓸 수 있는 이름 목록 (인증완료 센터들 + 관리자면 '안심상담맵 운영자') */
  identities: CommunityIdentity[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any
}

/**
 * 로그인한 사용자가 커뮤니티를 이용할 수 있는지 확인합니다.
 * 인증완료(approved) 센터가 하나 이상 연결된 계정이거나 관리자일 때만 허용됩니다.
 */
export async function getCommunityMember(): Promise<
  { ok: true; member: CommunityMember } | { ok: false; status: 401 | 403 }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { ok: false, status: 401 }

  const email = user.email
  const isAdmin = isAdminEmail(email)
  const service = createServiceRoleClient()

  const { data: accounts } = await service
    .from('provider_accounts')
    .select('provider_id')
    .eq('email', email)
  const providerIds: string[] = (accounts ?? []).map((a: { provider_id: string }) => a.provider_id)

  let approved: CommunityIdentity[] = []
  if (providerIds.length > 0) {
    const { data: providers } = await service
      .from('providers')
      .select('id, name')
      .in('id', providerIds)
      .eq('status', 'approved')
      .order('name')
    approved = ((providers as { id: string; name: string }[]) ?? []).map((p) => ({
      id: p.id,
      name: p.name,
    }))
  }

  if (!isAdmin && approved.length === 0) return { ok: false, status: 403 }

  const identities = isAdmin
    ? [{ id: ADMIN_IDENTITY, name: ADMIN_DISPLAY_NAME }, ...approved]
    : approved

  return { ok: true, member: { email, isAdmin, identities, service } }
}

export function forbidden(status: 401 | 403) {
  return NextResponse.json(
    {
      error:
        status === 401
          ? '로그인이 필요합니다.'
          : '커뮤니티는 인증이 완료된 센터장만 이용할 수 있습니다.',
    },
    { status }
  )
}

/** 작성자가 고른 이름(identity)이 실제로 쓸 수 있는 것인지 확인하고 저장할 값으로 바꿉니다. */
export function resolveAuthor(
  member: CommunityMember,
  identityId: unknown,
  isAnonymous: boolean
): { providerId: string | null; displayName: string } | null {
  const chosen =
    member.identities.find((i) => i.id === identityId) ??
    // 익명 글이면 어떤 이름으로 쓸지 고를 필요가 없으니 첫 번째 것으로 기록만 해둡니다.
    (isAnonymous ? member.identities[0] : undefined)
  if (!chosen) return null
  return {
    providerId: chosen.id === ADMIN_IDENTITY ? null : chosen.id,
    displayName: chosen.name,
  }
}

export function publicName(row: { is_anonymous: boolean; author_display_name: string }) {
  return row.is_anonymous ? ANONYMOUS_NAME : row.author_display_name
}

/** 첨부 이미지 경로가 이 버킷의 커뮤니티 업로드 경로인지 확인합니다. */
export function sanitizeImagePaths(paths: unknown, max: number): string[] | null {
  if (paths == null) return []
  if (!Array.isArray(paths)) return null
  const clean = paths.filter(
    (p): p is string => typeof p === 'string' && /^posts\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif)$/i.test(p)
  )
  if (clean.length !== paths.length || clean.length > max) return null
  if (new Set(clean).size !== clean.length) return null
  return clean
}

/**
 * 첨부하려는 이미지가 모두 "이 사람이 직접 올린 것"이거나 "이 글에 원래 있던 것"인지 확인합니다.
 * (다른 사람 글의 이미지 경로를 끼워넣은 뒤 글을 지워서 남의 사진을 삭제하는 것을 막기 위함)
 */
export async function imagePathsAllowed(
  member: CommunityMember,
  paths: string[],
  alreadyOnPost: string[] = []
) {
  const toCheck = paths.filter((p) => !alreadyOnPost.includes(p))
  if (toCheck.length === 0) return true
  const { data } = await member.service
    .from('community_uploads')
    .select('path')
    .in('path', toCheck)
    .eq('uploader_email', member.email)
  return ((data as { path: string }[]) ?? []).length === toCheck.length
}

/** 요청 본문을 안전하게 읽습니다 (비어 있거나 JSON이 아니면 빈 객체). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(req: Request): Promise<Record<string, any>> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' && !Array.isArray(body) ? body : {}
  } catch {
    return {}
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function signImagePaths(service: any, paths: string[]) {
  if (paths.length === 0) return []
  const { data } = await service.storage.from(COMMUNITY_BUCKET).createSignedUrls(paths, 60 * 60)
  return paths.map((path, i) => ({
    path,
    url: (data?.[i]?.signedUrl as string | undefined) ?? null,
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function removeImages(service: any, paths: string[]) {
  if (paths.length === 0) return
  const { error } = await service.storage.from(COMMUNITY_BUCKET).remove(paths)
  if (error) console.error('커뮤니티 이미지 삭제 실패:', error)
}

/** 글쓰기/수정 요청 본문 검증 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePostInput(body: any):
  | {
      category: string
      title: string
      body: string
      imagePaths: string[]
      isAnonymous: boolean
    }
  | { error: string } {
  if (!isCommunityCategory(body?.category)) return { error: '게시판을 선택해주세요.' }
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!title) return { error: '제목을 입력해주세요.' }
  if (title.length > 100) return { error: '제목은 100자 이내로 입력해주세요.' }
  if (!text) return { error: '내용을 입력해주세요.' }
  if (text.length > 10000) return { error: '내용은 10,000자 이내로 입력해주세요.' }
  const imagePaths = sanitizeImagePaths(body.imagePaths, MAX_IMAGES_PER_POST)
  if (!imagePaths) return { error: `이미지는 최대 ${MAX_IMAGES_PER_POST}장까지 첨부할 수 있습니다.` }
  return { category: body.category, title, body: text, imagePaths, isAnonymous: !!body.isAnonymous }
}
